/**
 * Copyright © 2015, Versatile Internet
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
    EventEmitter = require('events').EventEmitter,
    util = require('util'),

    Promise = require('bluebird'),
    mongoose = require('mongoose'),
    passport = require('passport'),
    LocalStrategy = require('passport-local').Strategy,
    RememberMeStrategy = require('passport-remember-me').Strategy,
    async = require('async'),
    bunyan = require('bunyan'),
    PrettyStream = require('bunyan-prettystream'),
    mkdirp = require('mkdirp'),

    consts = require('./app-constants'),
    createDbSupport = require('./support/db-support'),
    createDataSetup = require('./setup/data-setup'),
    createAclSetup = require('./setup/acl-setup'),
    createViewEngine = require('./support/view-engine'),
    createPluginResolver = require('./support/plugin-resolver');

/**
 * The App. This is the root of Pagespace.
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

util.inherits(Index, EventEmitter);

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
 * @param options Configuration object
 * @param options.logStreams Array of additional custom bunyan log streams
 * @param options.logLevel The logging level. See Bunyran
 * @param options.env. Set to 'development' to enable development mode
 * @param options.mediaDir A location to save uploaded media items. Defauults to ./media-uploads.
 *                         This directory will be created if it doesn't exist
 * @param options.commonViewLocals Locals to make available in every handlebars template
 */
Index.prototype.init = function(options) {

    var self = this;

    if(!options || typeof options !== 'object') {
        throw new Error('Pagespace must be initialized with at least a mongo connection string (db)');
    }

    //used in downstream request handlers and plugins for loading files relative to the application
    this.userBasePath = path.dirname(module.parent.filename);

    //logger setup
    var logStreams = options.logStreams instanceof Array ? options.logStreams : [];
    var prettyStdOut = new PrettyStream();
    prettyStdOut.pipe(process.stdout);
    this.logger =  bunyan.createLogger({
        name: 'pagespace',
        streams: [{
            level: options.logLevel || 'info',
            stream: prettyStdOut
        }].concat(logStreams)
    });
    this.logger.on('error', function (err) {
        self.emit('error', err);
    });
    var logger = this.logger.child();

    logger.info('Initializing the middleware...');

    //define where to save media uploads
    if(options.mediaDir) {
        this.mediaDir = options.mediaDir;
    } else {
        this.mediaDir = path.join(this.userBasePath, 'media-uploads');
        logger.warn('No media directory was specified. Defaulting to %s', this.mediaDir);
    }
    //create if it doesn't exist
    if(!fs.existsSync(this.mediaDir)) {
        var mediaDir = mkdirp.sync(this.mediaDir);
        if(mediaDir) {
            logger.info('New media directory created at %s', mediaDir);
        }
    }

    //configure the view engine
    var viewOpts = options.viewOpts || {};
    //default handlbars data option to false
    viewOpts.data = viewOpts.data !== 'boolean';
    this.viewEngine.setOpts(viewOpts);

    //common locals for all templates
    var commonViewLocals = options.commonViewLocals || {};
    this.viewEngine.setCommonLocals(commonViewLocals);

    //initialize db
    if(!options.db) {
        throw new Error('You must specify a db connection string');
    }
    this.mongoose.connect(options.db, options.dbOptions || {});
    this.dbSupport = this.dbSupport || createDbSupport({
        logger: logger,
        mongoose: this.mongoose
    });
    this.dbSupport.initModels();

    //this resolves plugin modules
    this.pluginResolver = this.pluginResolver || createPluginResolver({
        logger: logger,
        userBasePath: this.userBasePath,
        dbSupport: this.dbSupport
    });


    var db = this.mongoose.connection;
    db.on('error', function(err) {
        logger.fatal(err, 'Unable to connect to database');
        self.appState = consts.appStates.FAILED;
        self.emit('error', err);
    });
    db.once('open', function() {
        var conn = mongoose.connection;
        logger.info('DB connection established to %s:%s as %s', conn.host, conn.port, conn.user);
        self.dataSetup = self.dataSetup || createDataSetup({
            logger: logger,
            dbSupport: self.dbSupport
        });
        self.dataSetup.runSetup().spread(function(pluginModules, site) {

            //pre-resolve plugin modules (
            logger.info('Resolving plugin modules...');
            if (!pluginModules.length) {
                logger.info('There are no registered plugin modules. Add some via the dashboard');
            }
            pluginModules.forEach(function (pluginModule) {
                //requires and caches plugin modules for later page requests
                self.pluginResolver.require(pluginModule);
            });

            //general support instances supplied to all request handlers
            self.requestHandlerSupport = {
                logger: logger,
                viewEngine: self.viewEngine,
                dbSupport: self.dbSupport,
                pluginResolver: self.pluginResolver,
                site: site,
                mediaDir: self.mediaDir,
                userBasePath: self.userBasePath
            };

            logger.info('Initialized, waiting for requests');

            //app state is now ready
            self.appState = consts.appStates.READY;
            self.emit('ready');
        }).catch(function(err) {
            logger.fatal(err, 'Initialization error');
            self.appState = consts.appStates.FAILED;
            self.emit('error', err);
        });
    });
    db.on('close', function() {
        self.logger.warn('DB Connection closed');
    });
    db.on('disconnected', function() {
        self.logger.warn('DB Connection disconnected');
    });
    db.on('reconnected', function() {
        self.logger.warn('DB Connection reconnected');
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

    //set the user or default to a guest
    var user = req.user || consts.GUEST_USER;

    logger.trace('Request received for url [%s] with user role [%s]', req.url, user.role);

    //ACL determines if a user is not allowed to make this request
    if(!this.acl.isAllowed(user.role, req.url, req.method)) {
        var msg = 'User with role [%s] is not allowed to access %s (%s). Redirecting to login.';
        logger.info(msg, user.role, req.url, req.method);
        res.status(user.role === 'guest' ? 401 : 403);

        //force login request type
        req.originalUrl = req.url;
        req.session.loginToUrl = req.originalUrl;
        req.method = 'GET';
        req.url = '/_auth/login';
    }
    requestType = this._getRequestType(req.url);

    //delegate to the relevant handler for the request type
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

    //default to PAGE requeset
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
        //initialize uninitialized request handlers and cache
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

/**
 * Fires the callback when pagespce is ready and/or returns promise
 * @param callback
 * @return Promise
 */
Index.prototype.ready = function(callback) {

    var self = this;

    return new Promise(function(resolve, reject) {

        function success() {
            if(typeof callback === 'function') {
                callback.call(self, null);
            }
            resolve();
        }
        function fail(err) {
            err = err || new Error('Pagespace startup failed.');
            if(typeof callback === 'function') {
                callback.call(self, new Error(err));
            }
            reject(err);
        }

        if(self.appState === consts.appStates.FAILED) {
            fail();
        } if(self.appState === consts.appStates.READY) {
            success();
        } else {
            self.once('error', function(err) {
                fail(err);
            });
            self.once('ready', function() {
                success();
            });
        }
    });
};

/**
 * Extend Pagespcae with custom request handlers
 * Add custom request handler rules
 * @param rule
 */
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

/**
 * Add a new ACL rule
 * @param rule
 */
Index.prototype.addRuleToAcl = function(rule) {
    this.acl.addRuleToAcl(rule);
};

/**
 * Add multiple new ACL rules
 * @param rules
 */
Index.prototype.addRulesToAcl = function(rules) {
    this.acl.addRulesToAcl(rules);
};

/**
 * Gets the Pagesapce view engine. Required for Express setup
 * @returns {*}
 */
Index.prototype.getViewEngine = function() {
    return this.viewEngine.__express;
};

/**
 * Gets Pagespace's internal view directory. Required for Express setup
 * @returns {*}
 */
Index.prototype.getViewDir = function() {
    return path.join(__dirname, '/../views/pagespace');
};

/**
 * Gets Pagespace's internal default template location. Required for Express setup if you
 * want to use out of the box tempaltes
 * @returns {*}
 */
Index.prototype.getDefaultTemplateDir = function() {
    return path.join(__dirname, '/../views/templates');
};