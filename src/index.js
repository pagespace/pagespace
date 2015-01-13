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

var url = require('url'),
    path = require('path'),
    fs = require('fs'),

    mongoose = require('mongoose'),
    passport = require('passport'),
    LocalStrategy = require('passport-local').Strategy,
    RememberMeStrategy = require('passport-remember-me').Strategy,
    async = require('async'),
    bunyan = require('bunyan'),
    mkdirp = require('mkdirp'),

    consts = require('./app-constants'),
    createDbSupport = require('./misc/db-support'),
    createDataSetup = require('./setup/data-setup'),
    createAclSetup = require('./setup/acl-setup'),
    createViewEngine = require('./misc/view-engine'),
    createPartResolver = require('./misc/part-resolver');

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
    this.dataSetup = null;

    //request handlers
    this.requestHandlers = {};
};

/**
 * Resets the middleware
 */
Index.prototype.reset = function() {

    this.appState = consts.appStates.NOT_READY;
};

//export a new instance
module.exports = new Index();

/**
 * Initializes and returns the middleware
 */
Index.prototype.init = function(options) {

    var self = this;

    if(!options || typeof options !== 'object') {
        throw new Error('Pagespace must be initialized with at least a mongo connection string (db)');
    }

    //count requests;
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
    var logger = this.logger.child();

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
    }
    if(!fs.existsSync(this.mediaDir)) {
        var dir = mkdirp.sync(this.mediaDir);
        if(dir) {
            logger.info('New media directory created at %s', dir);
        }
    }

    //configure the view engine
    var viewOpts = options.viewOpts || {};
    //default handlbars data option to false
    viewOpts.data = viewOpts.data !== 'boolean';
    this.viewEngine.setOpts(viewOpts);

    //initialize db
    if(!options.db) {
        throw new Error('You must specify a db connection string');
    }
    this.mongoose.connect(options.db);
    this.dbSupport = this.dbSupport || createDbSupport({
        logger: logger,
        mongoose: this.mongoose
    });
    this.dbSupport.initModels();

    var db = this.mongoose.connection;
    db.once('open', function() {
        logger.info('DB connection established');
        self.dataSetup = self.dataSetup || createDataSetup({
            logger: logger,
            dbSupport: self.dbSupport
        });
        self.dataSetup.runSetup().spread(function(partModules, site) {

            //pre-resolve part modules (
            logger.info('Resolving part modules...');
            if (!partModules.length) {
                logger.info('There are no registered part modules. Add some via the dashboard');
            }
            partModules.forEach(function (partModule) {
                //requires and caches part modules for later page requests
                self.partResolver.require(partModule.module);
            });

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
    this.acl = createAclSetup().runSetup();
    this._configureAuth();

    //handle requests
    return function(req, res, next) {

        if(self.appState === consts.appStates.READY) {
            req.startTime = Date.now();
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
            ], function(err) {
                return next(err);
            });
        } else {
            logger.warn('Request received before middleware is ready (%s)', req.url);
            var notReadyErr = new Error();
            notReadyErr.status = 503;
            return next(notReadyErr);
        }
    };
};

/**
 * Handles a request
 * @param req
 * @param res
 * @param next
 * @returns {*}
 */
Index.prototype._doRequest = function(req, res, next) {

    var logger = this.logger;

    var requestHandler, requestType;
    var user = req.user || {
        username: 'guest',
        role: 'guest'
    };
    logger.debug('Request received for url [%s] with user role [%s]', req.url, user.role);
    if(!this.acl.isAllowed(user.role, req.url, req.method)) {
        var debugMsg = 'User with role [%s] is not allowed to access %s. Redirecting to login.';
        logger.debug(debugMsg, user.role, req.url);
        res.status(user.role === 'guest' ? 401 : 403);
        req.session.loginToUrl = req.url;
        requestType = consts.requests.LOGIN;
    } else {
        requestType = this._getRequestType(req.url);
    }
    requestHandler = this._getRequestHandler(requestType);
    return requestHandler(req, res, next);
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

    var middleware = this.requestHandlers[requestType.key];
    if(!middleware) {
        middleware = requestType.handler.init(this.requestHandlerSupport);
        this.requestHandlers[requestType.key] = middleware;
    }
    return middleware;
};

/**
 * Passport configuration
 */
Index.prototype._configureAuth = function() {

    var self = this;

    //setup passport/authentication
    passport.serializeUser(function(user, done) {
        done(null, {
            username: user.username,
            role: user.role,
            name: user.name,
            _id: user._id.toString()
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
};

Index.prototype.use = function(rule) {

    //validate
    if(typeof rule.key !== 'string') {
        throw new Error('Your request handler must have a valid key');
    }
    if(rule.regex instanceof RegExp === false) {
        throw new Error('Your request handler must have a valid regex pattern');
    }
    if(typeof rule.handler !== 'object') {
        throw new Error('You must supply a valid handler instance');
    }
    if(typeof rule.handler.doRequest !== 'function') {
        throw new Error('Your handler must implement a doRequest method');
    }

    consts.requests[rule.key] = rule;
};

Index.prototype.addRuleToAcl = function(rule) {
    this.acl.addRuleToAcl(rule);
};

Index.prototype.addRulesToAcl = function(rules) {
    this.acl.addRulesToAcl(rules);
};

Index.prototype.getViewDir = function() {
    return path.join(__dirname, '/../views');
};
Index.prototype.getViewEngine = function() {
    return this.viewEngine.__express;
};