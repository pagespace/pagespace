'use strict';

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
var Bluebird = require('bluebird');

//schemas
var createDbSupport = require('./misc/db-support');

//factories
var createPageHandler = require('./request-handlers/page-handler');
var createApiHandler = require('./request-handlers/api-handler');
var createDashboardHandler = require('./request-handlers/dashboard-handler');
var createPublishingHandler = require('./request-handlers/publishing-handler');
var createDataHandler = require('./request-handlers/data-handler');
var createMediaHandler = require('./request-handlers/media-handler');
var createLoginHandler = require('./request-handlers/login-handler');
var createLogoutHandler = require('./request-handlers/logout-handler');
var createStaticHandler = require('./request-handlers/static-handler');

//util
var consts = require('./app-constants');
var path = require('path');
var logLevel = require('./misc/log-level');
var logger =  bunyan.createLogger({ name: "index" });

var TAB = '\t';
GLOBAL.pagespace = {};

/**
 * The App
 * @constructor
 */
var Index = function() {

    this.reset();

    //dependencies
    this.mongoose = mongoose;
    this.dbSupport = createDbSupport();

    //page handlers
    this.createPageHandler = createPageHandler;
    this.createApiHandler = createApiHandler;
    this.createDashboardHandler = createDashboardHandler;
    this.createPublishingHandler = createPublishingHandler;
    this.createDataHandler = createDataHandler;
    this.createMediaHandler = createMediaHandler;
    this.createLoginHandler = createLoginHandler;
    this.createLogoutHandler = createLogoutHandler;
    this.createStaticHandler = createStaticHandler;
};

/**
 * Resets the middleware
 */
Index.prototype.reset = function() {
    this.urlHandlerMap = {};
    this.appState = consts.appStates.NOT_READY;
};

//export an new instance
module.exports = new Index();

/**
 * Initializes and returns the middleware
 */
Index.prototype.init = function(options) {

    var self = this;

    logLevel().set(options.logLevel || 'debug');
    logger.level(logLevel().get());

    this.mediaDir = options.mediaDir;
    this.serveDashboard = typeof options.serveDashboard === 'boolean' ? options.serveDashboard : true;

    logger.info('Initializing the middleware');

    this.dbSupport.initModels();

    this.parts = {};

    var dbConnection = options.db;
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

        var loadPartModules = self._loadPartModules();
        var loadAdminUser = self._loadAdminUser();
        var loadSite = self._loadSite();

        //once everything is ready
        Bluebird.join(loadPartModules, loadAdminUser, loadSite, function(parts, users, site) {

            var promises = [];

            //parts
            parts.forEach(function (part) {
                logger.debug(TAB + part.module);
                var partModule = require(part.module);
                partModule.init();
                self.parts[part._id] = partModule;
            });
            logger.info('Part modules loaded');

            //site
            if (!site) {
                logger.info("Creating first site");
                var Site = self.dbSupport.getModel('Site');
                var newSite = new Site({
                    _id: consts.DEFAULT_SITE_ID,
                    name: "New Pagespace site"
                });
                var saveNewSite = Bluebird.promisify(newSite.save, newSite);
                var saveSitePromise = saveNewSite()
                promises.push(saveSitePromise);
                saveSitePromise.then(function() {
                    logger.info("New site created successfully");
                })
            } else {
                promises.push(site);
            }

            //users
            if (users.length === 0) {
                logger.info("Creating admin user with default admin password");
                var User = self.dbSupport.getModel('User');
                var defaultAdmin = new User({
                    username: "admin",
                    password: "admin",
                    role: "admin",
                    updatePassword: true
                });
                var saveAdminUser = Bluebird.promisify(defaultAdmin.save, defaultAdmin);
                var saveAdminUserPromise = saveAdminUser();
                promises.push(saveAdminUser());
                saveAdminUserPromise.then(function() {
                    logger.info("Admin user created successfully");
                });
            } else {
                promises.push(users[0])
            }
            return promises;
        }).spread(function(site) {

            //set up request handlers
            self.urlHandlerMap[consts.requests.PAGE] = self.createPageHandler(self.dbSupport, self.parts, site);
            self.urlHandlerMap[consts.requests.API] = self.createApiHandler(self.dbSupport);
            self.urlHandlerMap[consts.requests.DASHBOARD] = self.createDashboardHandler();
            self.urlHandlerMap[consts.requests.PUBLISH] = self.createPublishingHandler(self.dbSupport);
            self.urlHandlerMap[consts.requests.DATA] = self.createDataHandler(self.parts, self.dbSupport);
            self.urlHandlerMap[consts.requests.MEDIA] = self.createMediaHandler(self.dbSupport, self.mediaDir);
            self.urlHandlerMap[consts.requests.LOGIN] = self.createLoginHandler();
            self.urlHandlerMap[consts.requests.LOGOUT] = self.createLogoutHandler();
            self.urlHandlerMap[consts.requests.STATIC] = self.createStaticHandler();

            logger.info('Initialized, waiting for requests');
            self.appState = consts.appStates.READY;
        }).catch(function(e) {
            logger.error(e, 'Initialization error');
        });
    });

    //auth and acl setup
    this.acl = this._configureAuth();

    //handle requests
    return function(req, res, next) {

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
                    self._doRequest(req, res, next);
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
 * Preloads the parts modules
 * @returns {*}
 */
Index.prototype._loadPartModules = function() {

    logger.info('Loading part modules...');

    //cache part modules
    var Part = this.dbSupport.getModel('Part');
    var query = Part.find({});
    var getParts = Bluebird.promisify(query.exec, query);
    return getParts();
};

/**
 * Gets the admin users (if exists)
 * @returns {*}
 */
Index.prototype._loadAdminUser = function() {

    //create an admin user on first run
    var User = this.dbSupport.getModel('User');
    var query = User.find({ role: 'admin'}, 'username');
    var getAdminUser = Bluebird.promisify(query.exec, query);
    return getAdminUser();
};

/**
 * Gets the site (if exists)
 * @returns {*}
 */
Index.prototype._loadSite = function() {

    //create an admin user on first run
    var Site = this.dbSupport.getModel('Site');
    var query = Site.findById(consts.DEFAULT_SITE_ID);
    var getSite = Bluebird.promisify(query.exec, query);
    return getSite();
};

/**
 * Handles a request
 * @param req
 * @param res
 * @param next
 * @returns {*}
 */
Index.prototype._doRequest = function(req, res, next) {
    var requestHandler, urlType;
    var user = req.user || this._createGuestUser();
    logger.debug('Request received for url [%s] with user role [%s]', req.url, user.role);
    if(!this.acl.isAllowed(user.role, req.url, req.method)) {
        var debugMsg =
            "User with role [" + user.role + "] is not allowed to access " + req.url + ". Redirecting to login";
        logger.debug(debugMsg);
        req.session.loginToUrl = req.url;
        urlType = consts.requests.LOGIN;
    } else {
        urlType = this._getUrlType(req.url);
    }
    requestHandler = this.urlHandlerMap[urlType];

    return requestHandler._doRequest(req, res, next);
};

/**
 * Maps a url to a page type
 * @param url
 * @returns {*}
 */
Index.prototype._getUrlType = function(url) {

    var type;
    var i, requestMetaKey, requestMetaKeys = Object.keys(consts.requestMeta);
    for(i = 0; i < requestMetaKeys.length; i++) {
        requestMetaKey = requestMetaKeys[i];
        if(consts.requestMeta[requestMetaKey].regex && consts.requestMeta[requestMetaKey].regex.test(url)) {
            type = consts.requestMeta[requestMetaKey].type;
            break;
        }
    }
    if(!type) {
        type = consts.requests.PAGE;
    }

    return type;
};

/**
 * Passport configuration
 */
Index.prototype._configureAuth = function() {

    var self = this;

    //setup acl
    var acl = new Acl();

    acl.allow(['guest', 'admin'], '.*', ['GET', 'POST']);
    acl.allow(['admin'], consts.requestMeta.MEDIA.regex, ['POST', 'PUT', 'DELETE']);
    acl.allow(['admin'], consts.requestMeta.DATA.regex, ['GET', 'POST', 'PUT', 'DELETE']);
    acl.allow(['admin'], consts.requestMeta.API.regex, ['GET', 'POST', 'PUT', 'DELETE']);
    acl.allow(['admin'], consts.requestMeta.PUBLISH.regex, ['GET', 'POST', 'PUT', 'DELETE']);
    acl.allow(['admin'], consts.requestMeta.DASHBOARD.regex, ['GET', 'POST', 'PUT', 'DELETE']);

    if(!this.serveDashboard) {
        acl.allow([], consts.requestMeta.LOGIN.regex, ['GET', 'POST', 'PUT', 'DELETE']);
        acl.allow([], consts.requestMeta.API.regex, ['GET', 'POST', 'PUT', 'DELETE']);
        acl.allow([], consts.requestMeta.PUBLISH.regex, ['GET', 'POST', 'PUT', 'DELETE']);
        acl.allow([], consts.requestMeta.DASHBOARD.regex, ['GET', 'POST', 'PUT', 'DELETE']);
    }

    //setup passport/authentication
    passport.serializeUser(function(user, done) {
        done(null, {
            username: user.username,
            role: user.role
        });
    });

    passport.deserializeUser(function(userProps, done) {
        var User = self.dbSupport.getModel('User');
        var user = new User(userProps);
        done(null, user);
    });

    passport.use(new LocalStrategy(
        function(username, password, done) {
            var User = self.dbSupport.getModel('User');
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
            var User = self.dbSupport.getModel('User');
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

Index.prototype._createGuestUser = function() {
    return {
        username: 'guest',
        role: 'guest',
        name: 'Geoff Capes'
    };
};