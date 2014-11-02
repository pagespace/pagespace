"use strict";

//core
var url = require('url');

//support
var mongoose = require('mongoose');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var RememberMeStrategy = require('passport-remember-me').Strategy;

var async = require('async');
var bunyan = require('bunyan');
var Acl = require("./misc/acl");
var BluebirdPromise = require('bluebird');

//models
var Page = require('./models/page');
var Part = require('./models/part');
var User = require('./models/user');

//factories
var createPageResolver = require('./misc/page-resolver');
var createPageHandler = require('./request-handlers/page-handler');
var createApiHandler = require('./request-handlers/api-handler');
var createAdminHandler = require('./request-handlers/admin-handler');
var createDataHandler = require('./request-handlers/data-handler');
var createLoginHandler = require('./request-handlers/login-handler');
var createLogoutHandler = require('./request-handlers/logout-handler');

//util
var util = require('./misc/util');
var consts = require('./app-constants');
var logger =  bunyan.createLogger({ name: "index" });
logger.level('debug');

var TAB = '\t';

/**
 * The App
 * @constructor
 */
var Index = function() {

    this.reset();

    //dependencies
    this.mongoose = mongoose;
    this.Page = Page;
    this.Part = Part;
    this.User = User;
};

/**
 * Resets the middleware
 */
Index.prototype.reset = function() {
    this.urlsToResolve = [];
    this.appState = consts.appStates.NOT_READY;
};

//export an new instance
module.exports = new Index();

/**
 * Initializes and returns the middleware
 */
Index.prototype.init = function(options) {

    var self = this;

    logger.info("Initializing the middleware");

    this.templatesDir = options.templatesDir || null;
    this.viewBase = options.viewBase || null;
    this.parts = {};

    var dbConnection = options.dbConnection;
    if(!dbConnection) {
        throw new Error('You must specify a db connection string');
    }

    this.mongoose.connect(dbConnection);
    var db = this.mongoose.connection;
    db.on('error', function(err) {
        logger.error(err, 'connection error');
    });
    db.once('open', function callback () {
        logger.info("Db connection established");

        var readyPromises = [];
        readyPromises.push(self.loadPageUrls());
        readyPromises.push(self.loadPartModules());
        readyPromises.push(self.createFirstAdminUser());

        //once everything is ready
        BluebirdPromise.all(readyPromises).then(function() {
            self.appState = consts.appStates.READY;

            logger.info('Initialized, waiting for requests');

            //set up page handlers
            self.pageHandler = createPageHandler(createPageResolver(), self.parts);
            self.apiHandler = createApiHandler();
            self.adminHandler = createAdminHandler();
            self.dataHandler = createDataHandler(self.parts);
            self.loginHandler = createLoginHandler();
            self.logoutHandler = createLogoutHandler();

            //handler events
            self.apiHandler.on(consts.events.PAGES_UPDATED, function() {
                self.loadPageUrls();
            });
        }).catch(function(e) {
            logger.error(e, 'Initialization error');
        });
    });

    //auth and acl setup
    this.acl = this.configureAuth();

    //handle requests
    return function(req, res, next) {
        logger.debug('Request received for ' + req.url);

        if(self.appState === consts.appStates.READY) {
            req.url = url.parse(req.url).pathname;
            async.series([
                function (callback) {
                    passport.initialize()(req, res, callback);
                },
                function (callback) {
                    passport.session()(req, res, callback);
                },
                function () {
                    self.doRequest(req, res, next);
                }
            ]);
        } else {
            logger.info("Request received before middleware is ready");
            var notReadyErr = new Error();
            notReadyErr.status = 503;
            return next(notReadyErr);
        }
    };
};

/**
 * Gets all the page urls from the db that the middleware should listen for
 * @returns {*}
 */
Index.prototype.loadPageUrls = function() {

    var self = this;

    //get all pages to resolve
    var query = Page.find({});
    var getPages = BluebirdPromise.promisify(query.exec, query);
    getPages().then(function (pages) {
        logger.debug("Urls to resolve are:");
        self.urlsToResolve = pages.map(function (page) {
            logger.debug(TAB + page.url);
            return page.url;
        });
    });
    return getPages;
};

/**
 * Preloads the parts modules
 * @returns {*}
 */
Index.prototype.loadPartModules = function() {

    var self = this;

    //cache part modules
    var query = Part.find({});
    var getParts = BluebirdPromise.promisify(query.exec, query);
    getParts().then(function (parts) {
        logger.debug('Loading part modules');
        parts.forEach(function (part) {
            logger.debug(TAB + part.module);
            var partModule = require(part.module);
            partModule.init();
            self.parts[part._id] = partModule;
        });
    });

    return getParts;
};

/**
 * If there is no admin user, this is the first one and a default one is created
 * @returns {*}
 */
Index.prototype.createFirstAdminUser = function() {

    //create an admin user on first run
    var query = User.find({ role: 'admin'}, 'username');
    var createAdminUser = BluebirdPromise.promisify(query.exec, query);
    createAdminUser().then(function(users) {
        if(users.length === 0) {
            logger.info("Admin user created with default admin password");
            var defaultAdmin = new User({
                username: "admin",
                password: "admin",
                role: "admin"
            });
            defaultAdmin.save(function(err) {
                if(err) {
                    logger.error(err, 'Trying to save the default admin user');
                } else {
                    logger.info("Admin user created successfully");
                }
            });
        }
    });
    return createAdminUser;
};

/**
 * Handles a request
 * @param req
 * @param res
 * @param next
 * @returns {*}
 */
Index.prototype.doRequest = function(req, res, next) {
    var requestHandler, urlType;
    var user = req.user || User.createGuestUser();
    if(!this.acl.isAllowed(user.role, req.url, req.method)) {
        var debugMsg =
            "User with role [" + user.role + "] is not allowed to access " + req.url + ". Redirecting to login";
        logger.debug(debugMsg);
        req.session.loginToUrl = req.url;
        urlType = consts.requestTypes.LOGIN;
    } else {
        urlType = this.getUrlType(req.url);
    }

    if(urlType === consts.requestTypes.PAGE) {
        requestHandler = this.pageHandler;
    } else if(urlType === consts.requestTypes.API) {
        requestHandler = this.apiHandler;
    } else if(urlType === consts.requestTypes.ADMIN) {
        requestHandler = this.adminHandler;
    } else if(urlType === consts.requestTypes.DATA) {
        requestHandler = this.dataHandler;
    } else if(urlType === consts.requestTypes.LOGIN) {
        requestHandler = this.loginHandler;
    } else if(urlType === consts.requestTypes.LOGOUT) {
        requestHandler = this.logoutHandler;
    } else {
        var notFoundErr = new Error();
        notFoundErr.status = 404;
        return next(notFoundErr);
    }
    return requestHandler.doRequest(req, res, next);

};

/**
 * Maps a url to a page type
 * @param url
 * @returns {*}
 */
Index.prototype.getUrlType = function(url) {

    var type;

    if(this.urlsToResolve.indexOf(url) >= 0) {
        type = consts.requestTypes.PAGE;
    } else if(consts.requestRegex.API.test(url)) {
        type = consts.requestTypes.API;
    } else if (consts.requestRegex.ADMIN.test(url)) {
        type = consts.requestTypes.ADMIN;
    } else if (consts.requestRegex.DATA.test(url)) {
        type = consts.requestTypes.DATA;
    } else if (consts.requestRegex.LOGIN.test(url)) {
        type = consts.requestTypes.LOGIN;
    } else if (consts.requestRegex.LOGOUT.test(url)) {
        type = consts.requestTypes.LOGOUT;
    } else {
        type = consts.requestTypes.OTHER;
    }

    return type;
};

/**
 * Passport configuration
 */
Index.prototype.configureAuth = function() {

    //setup acl
    var acl = new Acl();
    acl.allow(["guest", "admin"], ".*", ["GET", "POST"]);
    acl.allow(["guest", "admin"], consts.requestRegex.LOGIN, ["GET", "POST"]);
    acl.allow(["guest", "admin"], consts.requestRegex.LOGOUT, ["GET", "POST"]);
    acl.allow(["admin"], consts.requestRegex.API, ["GET", "POST", "PUT", "DELETE"]);
    acl.allow(["admin"], consts.requestRegex.ADMIN, ["GET", "POST", "PUT", "DELETE"]);
    acl.allow(["admin"], consts.requestRegex.DATA, ["GET", "POST", "PUT", "DELETE"]);

    //setup passport/authentication
    passport.serializeUser(function(user, done) {
        done(null, {
            username: user.username,
            role: user.role
        });
    });

    passport.deserializeUser(function(userProps, done) {
        var user = new User(userProps);
        done(null, user);
    });

    passport.use(new LocalStrategy(
        function(username, password, done) {
            User.findOne({ username: username }, function(err, user) {
                if (err) {
                    return done(err);
                }
                if (!user) {
                    return done(null, false, { message: 'Incorrect username.' });
                }
                user.comparePassword(password, function(err, match) {
                    if(!match) {
                        done(null, false, { message: 'Incorrect password.' });
                    } else {
                        done(null, user);
                    }
                });
            });
        }
    ));
    passport.use(new RememberMeStrategy(
        function(token, done) {
            User.findOne({ rememberToken: token }, function(err, user) {
                if(err) {
                    return done(err);
                }
                if(!user) {
                    return done(null, false);
                } else {
                    return done(null, user);
                }
            });
        },
        function(user, done) {
            user.rememberToken = user.generateToken();
            user.save(function(err) {
                if(err) {
                    return done(err);
                } else {
                    return done(null, user.rememberToken);
                }
            });
        }
    ));

    return acl;
};