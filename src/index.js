'use strict';

//deps
const
    path = require('path'),
    fs = require('fs'),
    EventEmitter = require('events').EventEmitter,
    Promise = require('bluebird'),
    mongoose = require('mongoose'),
    bunyan = require('bunyan'),
    PrettyStream = require('bunyan-prettystream'),
    mkdirp = require('mkdirp'),
    consts = require('./app-constants'),
    createRouter = require('./router'),
    createDbSupport = require('./support/db-support'),
    createDbSetup = require('./setup/db-setup'),
    createViewEngine = require('./support/view-engine'),
    createPluginResolver = require('./support/plugin-resolver'),
    includeCache = require('./support/include-cache');

/**
 * The App. This is the root of Pagespace.
 * @constructor
 */
class Index extends EventEmitter {

    constructor() {
        super();
        this.reset();

        //dependencies
        this.mongoose = mongoose;
        this.viewEngine = createViewEngine();
        this.dbSupport = null;
        this.dataSetup = null;
    }

    /**
     * Resets the middleware
     */
    reset() {
        this.appState = consts.appStates.NOT_READY;
    }

    /**
     * Initializes and returns the middleware
     * @param opts Configuration object
     * @param opts.logger Custom Bunyan logger
     * @param opts.logLevel The logging level. Only applies if not providong a custom logger
     * @param opts.mediaDir A location to save uploaded media items. Defauults to ./media-uploads.
     *                         This directory will be created if it doesn't exist
     * @param opts.locale A string contain a BCP47 langugae tag or a function that resolves to one. The function takes
     *                       two arguments. The Express request object and the page object for the resolved page.
     * @param opts.cacheOpts Caching options. See Cacheman (https://github.com/cayasso/cacheman)
     * @param opts.imageVariations When users upload images variations of that image can be created, given these sizes.
     *                      E.g.
     *                      <code>[{ label: 'header', width: '100', height: 'auto' }]</cod
     *                      Resize objects with the label 'thumb' will be automatically applied when an image is uploaded
     * @param opts.commonViewLocals Locals to make available in every handlebars template
     */
    init(opts) {

        if(!opts || typeof opts !== 'object') {
            throw new Error('Pagespace must be initialized with at least a mongo connection string (db)');
        }

        //used in downstream request handlers and plugins for loading files relative to the application
        this.userBasePath = path.dirname(module.parent.filename);

        //logger setup
        if(opts.logger) {
            this.logger = opts.logger.child();
        } else {
            const prettyStdOut = new PrettyStream();
            prettyStdOut.pipe(process.stdout);
            this.logger = bunyan.createLogger({
                name: 'pagespace',
                streams: [{
                    level: opts.logLevel || 'info',
                    stream: prettyStdOut
                }]
            });
        }

        const logger = this.logger;
        logger.on('error', (err) => {
            this.emit('error', err);
        });
        logger.info('Initializing the middleware...');

        //define where to save media uploads
        if(opts.mediaDir) {
            this.mediaDir = opts.mediaDir;
        } else {
            this.mediaDir = path.join(this.userBasePath, 'media-uploads');
            logger.warn('No media directory was specified. Defaulting to %s', this.mediaDir);
        }
        //create if it doesn't exist
        if(!fs.existsSync(this.mediaDir)) {
            const mediaDir = mkdirp.sync(this.mediaDir);
            if(mediaDir) {
                logger.info('New media directory created at %s', mediaDir);
            }
        }

        //configure the view engine
        const viewOpts = opts.viewOpts || {};
        //default handlebars data option to false
        viewOpts.data = viewOpts.data !== 'boolean';
        this.viewEngine.setOpts(viewOpts);

        //common locals for all templates
        const commonViewLocals = opts.commonViewLocals || {};
        this.viewEngine.setCommonLocals(commonViewLocals);

        //locale setup
        this.localeResolver = typeof opts.locale === 'function' ? opts.locale : () => {
            return opts.locale || consts.DEFAULT_LOCALE;
        };

        //cache setup
        includeCache.init(opts.cacheOpts);

        //initialize db
        if(!opts.db) {
            throw new Error('You must specify a db connection string');
        }
        this.mongoose.connect(opts.db, opts.dbOptions || {});
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

        //analytics
        const analytics = opts.analytics || false;

        //other settings
        //define a default thumbnail size
        const imageVariations = opts.imageVariations || consts.DEFAULT_IMAGE_VARIATIONS;

        //db
        const db = this.mongoose.connection;
        db.on('error', (err) => {
            logger.fatal(err, 'Unable to connect to database');
            this.appState = consts.appStates.FAILED;
            this.emit('error', err);
        });
        db.once('open', () => {
            const conn = mongoose.connection;
            logger.info('DB connection established to %s:%s as %s', conn.host, conn.port, conn.user || 'anon');

            this.dataSetup = this.dataSetup || createDbSetup({
                    logger: logger,
                    dbSupport: this.dbSupport,
                    userBasePath: this.userBasePath
                });

            this.dataSetup.runSetup().spread((pluginModules, site) => {

                //pre-resolve plugin modules (
                logger.info('Resolving plugin modules...');
                if (!pluginModules.length) {
                    logger.info('There are no registered plugin modules. Add some via the dashboard');
                }

                pluginModules.forEach((pluginModule) => {
                    //requires and caches plugin modules for later page requests
                    this.pluginResolver.require(pluginModule);
                });

                //general support instances supplied to all request handlers
                this.middlewareSupport = {
                    logger: logger,
                    viewEngine: this.viewEngine,
                    dbSupport: this.dbSupport,
                    pluginResolver: this.pluginResolver,
                    site: site,
                    mediaDir: this.mediaDir,
                    userBasePath: this.userBasePath,
                    localeResolver: this.localeResolver,
                    analytics: analytics,
                    imageVariations: imageVariations
                };

                this.router = createRouter(this.middlewareSupport);

                logger.info('Initialized, waiting for requests');

                //app state is now ready
                this.appState = consts.appStates.READY;
                this.emit('ready');
            }).catch((err) => {
                logger.fatal(err, 'Initialization error');
                this.appState = consts.appStates.FAILED;
                this.emit('error', err);
            });
        });
        db.on('close', () => {
            this.logger.warn('DB Connection closed');
        });
        db.on('disconnected', () => {
            this.logger.warn('DB Connection disconnected');
        });
        db.on('reconnected', () => {
            this.logger.warn('DB Connection reconnected');
        });

        //handle requests
        return (req, res, next) => {
            if(this.appState === consts.appStates.READY) {
                req.startTime = Date.now();
                //routes requests to internal middleware
                return this.router(req, res, next);

            } else {
                logger.warn('Request received before middleware is ready (%s)', req.url);
                const notReadyErr = new Error();
                notReadyErr.status = 503;
                return next(notReadyErr);
            }
        };
    }

    /**
     * Fires the callback when pagespce is ready and/or returns promise
     * @param callback
     * @return Promise
     */
    ready(callback) {
        return new Promise((resolve, reject) => {
            const success = () => {
                if(typeof callback === 'function') {
                    callback.call(this, null);
                }
                resolve();
            };
            const fail = (err) => {
                err = err || new Error('Pagespace startup failed.');
                if(typeof callback === 'function') {
                    callback.call(this, new Error(err));
                }
                reject(err);
            };

            if(this.appState === consts.appStates.FAILED) {
                fail();
            } if(this.appState === consts.appStates.READY) {
                success();
            } else {
                this.once('error', (err) => {
                    fail(err);
                });
                this.once('ready', () => {
                    success();
                });
            }
        });
    }

    /**
     * Call when server shutsdown
     */
    stop() {
        this.mongoose.disconnect();
        this.appState = consts.appStates.STOPPED;
        this.logger.info('Pagespace shutdown.');
    }

    /**
     * Gets the Pagesapce view engine. Required for Express setup
     * @returns {*}
     */
    getViewEngine() {
        return this.viewEngine.__express;
    }

    /**
     * Gets Pagespace's internal view directory. Required for Express setup
     * @returns {*}
     */
    getViewDir() {
        return path.join(__dirname, '/../views/pagespace');
    }

    /**
     * Gets Pagespace's internal default template location. Required for Express setup if you
     * want to use out of the box tempaltes
     * @returns {*}
     */
    getDefaultTemplateDir() {
        return path.join(__dirname, '/../views/templates');
    }
}

//export a new instance
module.exports = new Index();