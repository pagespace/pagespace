/**
 * Copyright © 2015, Philip Mander
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the Lesser GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * Lesser GNU General Public License for more details.
 *
 * You should have received a copy of the Lesser GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

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
var Acl = require('./misc/acl');
var Bluebird = require('bluebird');

//schemas
var createDbSupport = require('./misc/db-support');

//other
var createViewEngine = require('./misc/view-engine');
var createPartResolver = require('./misc/part-resolver');

//util
var consts = require('./app-constants');
var path = require('path');
var mkdirp = require('mkdirp');

/**
 * The App
 * @constructor
 */
var Index = function() {

    this.reset();

    //dependencies
    this.mongoose = mongoose;
    this.viewEngine = createViewEngine();
    this.dbSupport = null;

    //request handlers
    this.requestHandlers = {};
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

    //count requests;
    this.requestCount = 0;
    this.userBasePath = path.dirname(module.parent.filename);

    //logger setup
    var logStreams = options.logStreams instanceof Array || [];
    this.logger =  bunyan.createLogger({
        name: 'pagespace',
        streams: [{
            level: options.logLevel || 'info',
            stream: process.stdout
        }].concat(logStreams)
    });
    var logger = this.logger.child({ phase : 'init'});

    logger.info('Initializing the middleware...');

    //this resolves part modules
    this.partResolver = this.partResolver || createPartResolver({
        logger: logger,
        userBasePath: this.userBasePath
    });

    //define where to save media uploads
    if(options.mediaDir) {
        this.mediaDir = options.mediaDir;
    } else {
        this.mediaDir = path.join(this.userBasePath, 'media-uploads');
        logger.warn('No media directory was specified. Defaulting to %s', this.mediaDir);
        var dir = mkdirp.sync(this.mediaDir);
        if(dir) {
            logger.info('New media directory created at %s', dir);
        }
    }

    //optionally do not serve the dashboard
    this.serveDashboard = typeof options.serveDashboard === 'boolean' ? options.serveDashboard : true;

    //initialize db
    this.dbSupport = this.dbSupport || createDbSupport({ logger: logger });
    this.dbSupport.initModels();
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
        logger.info('Db connection established');

        var loadPartModules = self._loadPartModules();
        var loadAdminUser = self._loadAdminUser();
        var loadSite = self._loadSite();

        //once everything is ready
        Bluebird.join(loadPartModules, loadAdminUser, loadSite, function(parts, users, site) {

            var promises = [];

            //pre-resolve part modules (
            logger.info('Resolving part modules...');
            if(!parts.length) {
                logger.info('There are no registered part modules. Add some via the dashboard');
            }
            parts.forEach(function (part) {
                //requires a caches part modules for later page requests
                self.partResolver.require(part.module);
            });

            //setup the site model for first run
            if (!site) {
                logger.info('Creating first site');
                var Site = self.dbSupport.getModel('Site');
                var newSite = new Site({
                    _id: consts.DEFAULT_SITE_ID,
                    name: 'New Pagespace site'
                });
                var saveNewSite = Bluebird.promisify(newSite.save, newSite);
                var saveSitePromise = saveNewSite();
                promises.push(saveSitePromise);
                saveSitePromise.then(function() {
                    logger.info('New site created successfully');
                });
            } else {
                promises.push(site);
            }

            //set up the default admin user for first run
            if (users.length === 0) {
                logger.info('Creating admin user with default admin password');
                var User = self.dbSupport.getModel('User');
                var defaultAdmin = new User({
                    username: 'admin',
                    password: 'admin',
                    role: 'admin',
                    name: 'Administrator',
                    updatePassword: true
                });
                var saveAdminUser = Bluebird.promisify(defaultAdmin.save, defaultAdmin);
                var saveAdminUserPromise = saveAdminUser();
                promises.push(saveAdminUser());
                saveAdminUserPromise.then(function() {
                    logger.info('Admin user created successfully');
                });
            } else {
                promises.push(users[0]);
            }
            return promises;
        }).spread(function(site) {

            //general support instances supplied to all request handlers
            self.requestHandlerSupport = {
                logger: logger,
                viewEngine: self.viewEngine,
                dbSupport: self.dbSupport,
                partResolver: self.partResolver,
                site: site,
                mediaDir: self.mediaDir,
                userBasePath: self.userBasePath
            };

            logger.info('Initialized, waiting for requests');

            //app state is now ready
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
            //run all requests through passport first
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
            logger.info('Request received before middleware is ready');
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

    //cache part modules
    this.logger.info('Loading part modules...');
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

    //special logger per request, with request context data
    var logger = this.logger.child({
        sessionId: req.sessionID,
        reqId: this.requestCount++
    });

    var requestHandler, requestType;
    var user = req.user || this._createGuestUser();
    logger.debug('Request received for url [%s] with user role [%s]', req.url, user.role);
    if(!this.acl.isAllowed(user.role, req.url, req.method)) {
        var debugMsg =
            'User with role [%s] is not allowed to access %s. Redirecting to login.';
        logger.debug(debugMsg, user.role, req.url);
        req.session.loginToUrl = req.url;
        requestType = consts.requests.LOGIN;
    } else {
        requestType = this._getRequestType(req.url);
    }
    requestHandler = this._getRequestHandler(requestType);
    return requestHandler._doRequest(req, res, next, logger);
};

/**
 * Maps a url to a page type
 * @param url
 * @returns {*}
 */
Index.prototype._getRequestType = function(url) {

    var type;
    for(var requestKey in consts.requests) {
        if(consts.requests.hasOwnProperty(requestKey)) {
            if(consts.requests[requestKey].regex && consts.requests[requestKey].regex.test(url)) {
                type = consts.requests[requestKey];
                break;
            }
        }
    }

    if(!type) {
        type = consts.requests.PAGE;
    }

    return type;
};

/**
 * Maps a url to a page type
 * @param url
 * @returns {*}
 */
Index.prototype._getRequestHandler = function(requestType) {

    this.requestHandlers = {};

    var instance = this.requestHandlers[requestType.key];
    if(!instance) {
        instance = requestType.handler(this.requestHandlerSupport);
        this.requestHandlers[requestType.key] = instance;
    }
    return instance;
};

/**
 * Passport configuration
 */
Index.prototype._configureAuth = function() {

    var self = this;

    //setup acl
    var acl = new Acl();

    acl.allow(['guest', 'admin'], '.*', ['GET', 'POST']);
    acl.allow(['admin'], consts.requests.MEDIA.regex, ['POST', 'PUT', 'DELETE']);
    acl.allow(['admin'], consts.requests.DATA.regex, ['GET', 'POST', 'PUT', 'DELETE']);
    acl.allow(['admin'], consts.requests.API.regex, ['GET', 'POST', 'PUT', 'DELETE']);
    acl.allow(['admin'], consts.requests.PUBLISH.regex, ['GET', 'POST', 'PUT', 'DELETE']);
    acl.allow(['admin'], consts.requests.DASHBOARD.regex, ['GET', 'POST', 'PUT', 'DELETE']);

    if(!this.serveDashboard) {
        acl.allow([], consts.requests.LOGIN.regex, ['GET', 'POST', 'PUT', 'DELETE']);
        acl.allow([], consts.requests.API.regex, ['GET', 'POST', 'PUT', 'DELETE']);
        acl.allow([], consts.requests.PUBLISH.regex, ['GET', 'POST', 'PUT', 'DELETE']);
        acl.allow([], consts.requests.DASHBOARD.regex, ['GET', 'POST', 'PUT', 'DELETE']);
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

Index.prototype.getViewDir = function() {
    return path.join(__dirname, '/../views');
};
Index.prototype.getViewEngine = function() {
    return this.viewEngine.__express;
};