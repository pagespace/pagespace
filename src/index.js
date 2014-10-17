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
require('array.prototype.find');

//models
var Page = require('./models/page');
var Part = require('./models/part');
var User = require('./models/user');

//factories
var createPageResolver = require('./misc/page-resolver');
var createPageHandler = require('./request-handlers/page-handler');
var createApiHandler = require('./request-handlers/api-handler');
var createAdminHandler = require('./request-handlers/admin-handler');
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
var TheApp = function() {
    this.urlsToResolve = [];
    this.appState = consts.appStates.NOT_READY;
};


module.exports = function(opts) {
    return new TheApp().init(opts);
};

/**
 * Initializes and returns the middleware
 */
TheApp.prototype.init = function(options) {

    var self = this;

    logger.info("Initializing the middleware");

    this.templatesDir = options.templatesDir || null;
    this.viewBase = options.viewBase || null;
    this.parts = {};

    var readyPromises = [];

    var urlsDefferred = util.defer();
    readyPromises.push(urlsDefferred.promise);

    var partsDeffered = util.defer();
    readyPromises.push(partsDeffered.promise);

    var dbConnection = options.dbConnection;
    if(!dbConnection) {
        throw new Error('You must specify a db connection string');
    }

    mongoose.connect(dbConnection);
    var db = mongoose.connection;
    db.on('error', function(e) {
        logger.error('connection error:' + e);
    });
    db.once('open', function callback () {
        logger.info("Db connection established");

        //cache page urls to resolve
        Page.find({}, function(err, pages) {
            if(err) {
                logger.error(err);
                urlsDefferred.reject();
            } else {
                self.urlsToResolve = pages.map(function(doc) {
                    return doc.url;
                });
                    logger.debug("Urls to resolve are:");
                    self.urlsToResolve.forEach(function(url) {
                        logger.debug(TAB + url);
                    });

                urlsDefferred.resolve(consts.appStates.READY);
            }
        });

        //cache part modules
        Part.find({}, function(err, parts) {
            if(err) {
                logger.error(err);
                partsDeffered.reject();
            } else {
                logger.debug('Loading part modules');
                parts.forEach(function(part) {
                    try {
                        logger.debug(TAB + part.module);
                        var partModule = require(part.module);
                        readyPromises.push(partModule.init());
                        self.parts[part._id] = partModule;
                    } catch(e) {
                        partsDeffered.reject(e);
                    }
                });
                partsDeffered.resolve();
            }
        });

        //create an admin user on first run
        User.find({ role: 'admin'}, 'username', function(err, users) {
            if(err) {
                logger.error(err);
                urlsDefferred.reject();
            } else {
                if(users.length === 0) {
                    logger.info("Admin user created with default admin password");
                    var defaultAdmin = new User({
                        username: "admin",
                        password: "admin",
                        role: "admin"
                    });
                    defaultAdmin.save(function(err) {
                        if(err) {
                            logger.error(err);
                        } else {
                            logger.info("Admin user created successfully");
                        }
                    });
                }
            }
        });
    });

    //once everything is ready
    BluebirdPromise.all(readyPromises).then(function() {
        logger.info('Initialized, waiting for requests');
        self.appState = consts.appStates.READY;

        //set up page handlers
        self.pageHandler = createPageHandler(createPageResolver(), self.parts);
        self.apiHandler = createApiHandler();
        self.adminHandler = createAdminHandler();
        self.loginHandler = createLoginHandler();
        self.logoutHandler = createLogoutHandler();
    });

    //auth and acl setup
    this.acl = this.configureAuth();

    //handle requests
    return function(req, res, next) {
        logger.debug('Request received for ' + req.url);

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
    };
};

/**
 * Handles a request
 * @param req
 * @param res
 * @param next
 * @returns {*}
 */
TheApp.prototype.doRequest = function(req, res, next) {

    if(this.appState === consts.appStates.READY) {
        var requestHandler, urlType;
        var user = req.user || User.createGuestUser();
        if(!this.acl.isAllowed(user.role, req.url, req.method)) {
            logger.debug("User with role [" + user.role + "] is not allowed to access " + req.url + ". Redirecting to login");
            req.session.loginToUrl = req.url;
            urlType = consts.requestTypes.LOGIN;
        } else {
            urlType = this.getUrlType(req.url);
        }

        if(urlType === consts.requestTypes.PAGE) {
            requestHandler = this.pageHandler;
        } else if(urlType === consts.requestTypes.REST) {
            requestHandler = this.apiHandler;
        } else if(urlType === consts.requestTypes.ADMIN) {
            requestHandler = this.adminHandler;
        } else if(urlType === consts.requestTypes.LOGIN) {
            requestHandler = this.loginHandler;
        } else if(urlType === consts.requestTypes.LOGOUT) {
            requestHandler = this.logoutHandler;
        } else {
            next();
        }
        return requestHandler.doRequest(req, res, next);
    } else {
        var notReadyErr = new Error();
        notReadyErr.status = 503;
        return next();
    }
};

/**
 * Maps a url to a page type
 * @param url
 * @returns {*}
 */
TheApp.prototype.getUrlType = function(url) {

    var type;

    if(this.urlsToResolve.indexOf(url) >= 0) {
        type = consts.requestTypes.PAGE;
    } else if(consts.requestRegex.API.test(url)) {
        type = consts.requestTypes.REST;
    } else if (consts.requestRegex.ADMIN.test(url)) {
        type = consts.requestTypes.ADMIN;
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
TheApp.prototype.configureAuth = function() {

    //setup acl
    var acl = new Acl();
    acl.allow(["guest", "admin"], ".*", ["GET", "POST"]);
    acl.allow(["guest", "admin"], consts.requestRegex.LOGIN, ["GET", "POST"]);
    acl.allow(["admin"], consts.requestRegex.API, ["GET", "POST", "PUT", "DELETE"]);
    acl.allow(["admin"], consts.requestRegex.ADMIN, ["GET", "POST", "PUT", "DELETE"]);

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