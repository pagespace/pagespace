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

//schemas
var pageSchema = require('./schemas/page');
var partSchema = require('./schemas/part');
var userSchema = require('./schemas/user');
var modelFactory = require('./misc/model-factory');

//factories
var createPageHandler = require('./request-handlers/page-handler');
var createApiHandler = require('./request-handlers/api-handler');
var createAdminHandler = require('./request-handlers/admin-handler');
var createPublishingHandler = require('./request-handlers/publishing-handler');
var createDataHandler = require('./request-handlers/data-handler');
var createLoginHandler = require('./request-handlers/login-handler');
var createLogoutHandler = require('./request-handlers/logout-handler');

//util
var consts = require('./app-constants');
var path = require('path');
var logger =  bunyan.createLogger({ name: "index" });

var TAB = '\t';

/**
 * The App
 * @constructor
 */
var Index = function() {

    this.reset();

    //dependencies
    this.mongoose = mongoose;
    this.modelFactory = modelFactory();

    this.modelFactory.getModel('Page', require('./schemas/page'));
    this.modelFactory.getModel('Template', require('./schemas/template'));
    this.modelFactory.getModel('Part', require('./schemas/part'));
    this.modelFactory.getModel('User', require('./schemas/user'));

};

/**
 * Resets the middleware
 */
Index.prototype.reset = function() {
    this.urlHandlerMap = {};
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

    GLOBAL.logLevel = options.logLevel || 'debug';
    logger.level(logLevel);

    logger.info("Initializing the middleware");

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

        var loadPageUrls = self.loadPageUrls();
        var loadPartModules = self.loadPartModules();
        var createFirstAdminUser = self.createFirstAdminUser();

        //once everything is ready
        BluebirdPromise.join(loadPageUrls, loadPartModules, createFirstAdminUser, function(pages, parts, users) {

            //page urls to resolve
            logger.debug("Urls to resolve are:");
            self.urlsToResolve = pages.map(function (page) {
                logger.debug(TAB + page.url);
                return page.url;
            });
            logger.info("Page urls to resolve loaded");

            //parts
            parts.forEach(function (part) {
                logger.debug(TAB + part.module);
                var partModule = require(part.module);
                partModule.init();
                self.parts[part._id] = partModule;
            });
            logger.info('Part modules loaded');

            //users
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

            //set up page handlers
            self.urlHandlerMap[consts.requests.PAGE] = createPageHandler(self.modelFactory, self.parts);
            self.urlHandlerMap[consts.requests.API] = createApiHandler(self.modelFactory);
            self.urlHandlerMap[consts.requests.ADMIN] = createAdminHandler();
            self.urlHandlerMap[consts.requests.PUBLISH] = createPublishingHandler();
            self.urlHandlerMap[consts.requests.DATA] = createDataHandler(self.parts, self.modelFactory);
            self.urlHandlerMap[consts.requests.LOGIN] = createLoginHandler();
            self.urlHandlerMap[consts.requests.LOGOUT] = createLogoutHandler();

            //handler events
            self.urlHandlerMap[consts.requests.API].on(consts.events.PAGES_UPDATED, function() {
                self.loadPageUrls();
            });

            logger.info('Initialized, waiting for requests');
            self.appState = consts.appStates.READY;
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
    logger.info("Loading page urls to resolve...");

    //get all pages to resolve
    var Page = this.modelFactory.getModel('Page', pageSchema);
    var query = Page.find({});
    var getPages = BluebirdPromise.promisify(query.exec, query);
    return getPages();
};

/**
 * Preloads the parts modules
 * @returns {*}
 */
Index.prototype.loadPartModules = function() {

    var self = this;

    logger.info('Loading part modules...');

    //cache part modules
    var Part = this.modelFactory.getModel('Part', partSchema);
    var query = Part.find({});
    var getParts = BluebirdPromise.promisify(query.exec, query);
    return getParts();
};

/**
 * If there is no admin user, this is the first one and a default one is created
 * @returns {*}
 */
Index.prototype.createFirstAdminUser = function() {

    //create an admin user on first run
    var User = this.modelFactory.getModel('User', userSchema);
    var query = User.find({ role: 'admin'}, 'username');
    var createAdminUser = BluebirdPromise.promisify(query.exec, query);
    return createAdminUser();
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
    var user = req.user || this.modelFactory.getModel('User', userSchema).createGuestUser();
    if(!this.acl.isAllowed(user.role, req.url, req.method)) {
        var debugMsg =
            "User with role [" + user.role + "] is not allowed to access " + req.url + ". Redirecting to login";
        logger.debug(debugMsg);
        req.session.loginToUrl = req.url;
        urlType = consts.requests.LOGIN;
    } else {
        urlType = this.getUrlType(req.url);
    }
    requestHandler = this.urlHandlerMap[urlType];

    if(!requestHandler) {
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
        type = consts.requests.PAGE;
    } else {

        var i, requestMetaKey, requestMetaKeys = Object.keys(consts.requestMeta);
        for(i = 0; i < requestMetaKeys.length; i++) {
            requestMetaKey = requestMetaKeys[i];
            if(consts.requestMeta[requestMetaKey].regex && consts.requestMeta[requestMetaKey].regex.test(url)) {
                type = consts.requestMeta[requestMetaKey].type;
                break;
            }
        }
        if(!type) {
            type = consts.requests.OTHER;
        }
    }

    return type;
};

/**
 * Passport configuration
 */
Index.prototype.configureAuth = function() {

    var self = this;

    //setup acl
    var acl = new Acl();
    acl.allow(["guest", "admin"], ".*", ["GET", "POST"]);
    acl.allow(["guest", "admin"], consts.requestMeta.LOGIN.regex, ["GET", "POST"]);
    acl.allow(["guest", "admin"], consts.requestMeta.LOGOUT.regex, ["GET", "POST"]);
    acl.allow(["admin"], consts.requestMeta.API.regex, ["GET", "POST", "PUT", "DELETE"]);
    acl.allow(["admin"], consts.requestMeta.ADMIN.regex, ["GET", "POST", "PUT", "DELETE"]);
    acl.allow(["admin"], consts.requestMeta.DATA.regex, ["GET", "POST", "PUT", "DELETE"]);
    acl.allow(["admin"], consts.requestMeta.PUBLISH.regex, ["GET", "POST", "PUT", "DELETE"]);

    //setup passport/authentication
    passport.serializeUser(function(user, done) {
        done(null, {
            username: user.username,
            role: user.role
        });
    });

    passport.deserializeUser(function(userProps, done) {
        var User = self.modelFactory.getModel('User', userSchema);
        var user = new User(userProps);
        done(null, user);
    });

    passport.use(new LocalStrategy(
        function(username, password, done) {
            var User = self.modelFactory.getModel('User', userSchema);
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
            var User = self.modelFactory.getModel('User', userSchema);
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

Index.prototype.getAdminDir = function() {
    return path.join(__dirname, '/../admin-app');
};

Index.prototype.getViewDir = function() {
    return path.join(__dirname, '/../views');
};