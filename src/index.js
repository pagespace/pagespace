var mongoose = require('mongoose');
var hbs = require('hbs');
var passport = require('passport')
var LocalStrategy = require('passport-local').Strategy;
var async = require('async');
var Acl = require("./acl");
var pageResolver = require('./page-resolver')();
var logger = require('./logger')("debug");
var Promise = require('bluebird');
var Page = require('./models/page');
var Template = require('./models/template');
var Part = require('./models/part');
var User = require('./models/user')
require('array.prototype.find');

var requestTypes = {
    PAGE: 0,
    REST: 1,
    ADMIN: 2,
    LOGIN: 3,
    OTHER: 4
};

var appStates = {
    NOT_READY: 0,
    READY: 1
};

var apiRegex = new RegExp('^/_api/(pages|parts|templates|users)/?(.*)');
var adminRegex = new RegExp('^/_admin/(dashboard)/?(.*)');
var loginRegex = new RegExp('^/_(login)');

/**
 * The App
 * @constructor
 */
var TheApp = function() {

    this.urlsToResolve = [];
    this.appState = appStates.NOT_READY;
    this.pageResolver = pageResolver;
};

/**
 * Initializes and returns the middleware
 */
TheApp.prototype.init = function(options) {

    var self = this;

    logger.info("Initializing the middleware");

    this.templatesDir = options.templatesDir || null;
    this.viewBase = options.viewBase || null;
    this.parts = [];

    var readyPromises = [];

    var urlsDefferred = defer();
    readyPromises.push(urlsDefferred.promise);

    var partsDeffered = defer();
    readyPromises.push(partsDeffered.promise);

    mongoose.connect('mongodb://localhost/test');
    var db = (this.db = mongoose.connection);
    db.on('error', console.error.bind(console, 'connection error:'));
    db.once('open', function callback () {
        logger.info("Db connection established");

        Page.find({}, function(err, pages) {
            if(err) {
                logger.error(err);
                urlsDefferred.reject();
            } else {
                self.urlsToResolve = pages.map(function(doc) {
                    return doc.url;
                });
                if(logger.isDebug()) {
                    logger.debug("Urls to resolve are:")
                    self.urlsToResolve.forEach(function(url) {
                        logger.append(url);
                    });
                }
                urlsDefferred.resolve(appStates.READY);
            }
        });

        Part.find({}, function(err, parts) {
            if(err) {
                logger.error(err);
                partsDeffered.reject();
            } else {
                logger.debug('Loading part modules');
                parts.forEach(function(part) {
                    try {
                        logger.append(part.module);
                        self.parts.push(require(part.module));
                    } catch(e) {
                        partsDeffered.reject(e);
                    }

                });
                partsDeffered.resolve();
            }
        });

        User.find({ role: 'admin'}, 'username', function(err, users) {
            if(err) {
                logger.error(err);
                urlsDefferred.reject();
            } else {
                if(users.length === 0) {
                    logger.info("Admin user created with defaut admin password");
                    var defaultAdmin = new User({
                        username: "admin",
                        password: "admin",
                        role: "admin"
                    });
                    defaultAdmin.save(function(err, model) {
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

    var partsPromises = this.parts.map(function(part) {
        return part.init();
    });
    readyPromises.concat(partsPromises);

    Promise.all(readyPromises).then(function(state) {
        logger.info('Initialized, waiting for requests')
        self.appState = appStates.READY;
    });

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

    this.acl = new Acl();
    this.acl.allow(["guest", "admin"], ".*", ["GET", "POST"]);
    this.acl.allow(["guest", "admin"], loginRegex, ["GET", "POST"]);
    this.acl.allow(["admin"], apiRegex, ["GET", "POST", "PUT", "DELETE"]);
    this.acl.allow(["admin"], adminRegex, ["GET", "POST", "PUT", "DELETE"]);

    var doRequest = function(req, res, next) {
        var user = req.user || User.createGuestUser();

        if(!self.acl.isAllowed(user.role, req.url, req.method)) {
            logger.debug("User with role [" + user.role + "] is not allowed to access " +
                req.url + ". Redirecting to login");
            return res.redirect('/_login');
        }

        if(self.appState === appStates.READY) {
            var urlType = self.getUrlType(req.url)
            if(urlType === requestTypes.PAGE) {
                self.doPageRequest(req, res, next);
            } else if(urlType === requestTypes.REST) {
                self.doApiRequest(req, res, next);
            } else if(urlType == requestTypes.ADMIN) {
                self.doAdminRequest(req, res, next);
            } else if(urlType == requestTypes.LOGIN) {
                self.doLoginRequest(req, res, next);
            }
        } else {
            var notReadyErr = new Error();
            notReadyErr.status = 503;
            next();
        }
    };

    return function(req, res, next) {

        logger.debug("Request received for " + req.url);
        //TODO: parse url
        req.url = req.url.split("?")[0];
        async.series([
            function (callback) {
                passport.initialize()(req, res, callback);
            },
            function (callback) {
                passport.session()(req, res, callback);
            },
            function () {
                doRequest(req, res, next);
            }
        ]);
    };
};

/**
 * Process a valid request
 */
TheApp.prototype.doPageRequest = function(req, res, next) {

    var self = this;

    logger.info('Processing page request for ' + req.url);

    self.pageResolver.findPage(req.url).then(function(page) {

        logger.info('Page found for ' + req.url + ': ' + page.id);

        var pageData = {};
        page.regions.forEach(function(region) {
            if(region.part) {
                //TODO: region.part is an id. need to populate it first
                logger.log(region.part);

                var partModule = self.parts.find(function(loadedPartModule) {
                    return loadedPartModule.getName() === region.part.name;
                });

                pageData[region.region] = partModule.read(region.data, self.db);

                hbs.registerPartial(region.region, partModule.userView);
            }
        });

        var templateSrc = !page.template ? 'default.hbs' : page.template.src;
        return res.render(templateSrc, pageData, function(err, html) {

            if(err) {
                logger.error(err);
                next(err);
            } else {
                logger.info('Sending page for %s', req.url)
                res.send(html);
            }
        });
    }).catch(function(err) {
        console.log(err);
        next();
    });
};

TheApp.prototype.doApiRequest = function(req, res, next) {

    logger.info('Processing api request for ' + req.url);

    var collectionMap = {
        pages: {
            collection: 'page',
            model: Page
        },
        parts: {
            collection: 'part',
            model: Part
        },
        templates: {
            collection: 'template',
            model: Template
        },
        users: {
            collection: 'user',
            model: User
        }
    };

    var populations = {
        pages: 'parent template',
        parts: '',
        templates: '',
        users: ''
    };

    var apiInfo = apiRegex.exec(req.url);
    var apiType = apiInfo[1];
    var itemId = apiInfo[2];
    if(collectionMap.hasOwnProperty(apiType)) {
        var Model = collectionMap[apiType].model;
        var collection = collectionMap[apiType].collection;
        var filter = {};
        if(itemId) {
            delete req.body._id;
            delete req.body._v;
            filter._id = itemId;
            logger.debug('Searching for items by id [%s]: ' + collection, itemId);
        } else {
            logger.debug('Searching for items in collection: ' + collection);
        }

        //create a filter out of the query string
        for(var p in req.query) {
            if(req.query.hasOwnProperty(p)) {
                filter[p] = typeify(req.query[p]);
            }
        }

        if(req.method === 'GET') {
            Model['find'](filter).populate(populations[apiType]).exec(function(err, results) {
                if(err) {
                    logger.error(err);
                    next(err);
                } else {
                    logger.info('Sending response for %s', req.url);
                    results =  itemId ? results[0] : results;
                    if(req.headers['accept'].indexOf('application/json') === -1) {
                        var html =
                            '<pre style="font-family: Consolas, \'Courier New\'">' +
                            JSON.stringify(results, null, 4) +
                            '</pre>';
                        res.send(html, {
                            'Content-Type' : 'text/html'
                        }, 200);
                    } else {
                        res.json(results);
                    }

                }
            });
        } else if(req.method === 'POST') {
            if(itemId) {
                logger.warn('Cannot POST for this url. It shouldn\'t contain an id [%s]', itemId);
                next();
            } else {
                logger.info('Creating new %s', collection);
                logger.debug('Creating new collection with data: ' );
                logger.append(req.body);
                var model = new Model(req.body);
                model.save(function(err, model) {
                    if(err) {
                        logger.error(err);
                        next(err)
                    } else {
                        logger.info('Created successfully');
                        res.json(model);
                    }
                });
            }
        } else if(req.method === 'PUT') {
            if(!itemId) {
                logger.warn('Cannot PUT for this url. It should contain an id');
                next();
            } else {
                logger.info('Updating %s with id [%s]', collection, itemId);
                logger.debug('Updating collection with data: ' );
                logger.append(req.body);
                Model.findByIdAndUpdate(itemId, { $set: req.body }, function (err, model) {
                    if (err) {
                        logger.error(err);
                        next();
                    } else {
                        logger.info('Updated successfully');
                        res.json(model);
                    }
                });
            }
        } else if(req.method === 'DELETE') {
            if (!itemId) {
                logger.warn('Cannot DELETE for this url. It should contain an id');
                next();
            } else {
                logger.info('Removing %s with id [%s]', collection, itemId);
                Model.findByIdAndRemove(itemId, function (err, model) {
                    if (err) {
                        logger.error(err);
                        next();
                    } else {
                        logger.info('Deleted successfully');
                        res.statusCode = 204;
                        res.send();
                    }
                });
            }
        }
    }
};

TheApp.prototype.doAdminRequest = function(req, res, next) {
    logger.info('Processing admin request for ' + req.url);

    var apiInfo = adminRegex.exec(req.url);
    var adminType = apiInfo[1];

    return res.render(adminType, {}, function(err, html) {
        if(err) {
            logger.error(err);
            next(err);
        } else {
            logger.info('Sending page for %s', req.url);
            res.send(html);
        }
    });
};

TheApp.prototype.doLoginRequest = function(req, res, next) {
    logger.info('Processing special request for ' + req.url);

    if(req.method === 'GET') {
        return res.render('login', {}, function(err, html) {
            if(err) {
                logger.error(err);
                next(err);
            } else {
                logger.info('Sending page for %s', req.url);
                res.send(html);
            }
        });
    } else if(req.method === 'POST') {
        return passport.authenticate('local', function(err, user, info) {
            if (err) {
                return next(err);
            }
            if (!user) {
                return res.redirect('/_login');
            }
            req.logIn(user, function(err) {
                if (err) {
                    return next(err);
                } else {
                    return res.json({
                        href: '/_admin/dashboard'
                    });
                }
            });
        })(req, res, next);
    }
};

TheApp.prototype.getUrlType = function(url) {

    var type;

    if(this.urlsToResolve.indexOf(url) >= 0) {
        type = requestTypes.PAGE;
    } else if(apiRegex.test(url)) {
        type = requestTypes.REST;
    } else if (adminRegex.test(url)) {
        type = requestTypes.ADMIN;
    } else if (loginRegex.test(url)) {
        type = requestTypes.LOGIN;
    } else {
        type = requestTypes.OTHER;
    }

    return type;
};

function defer() {
    var resolve, reject;
    var promise = new Promise(function() {
        resolve = arguments[0];
        reject = arguments[1];
    });
    return {
        resolve: resolve,
        reject: reject,
        promise: promise
    };
}

function typeify(value) {
    if(!isNaN(parseFloat(+value))) {
        return parseFloat(value)
    } else if(value.toLowerCase() === 'false') {
        return false;
    } else if(value.toLowerCase() === 'true') {
        return true
    } else {
        return value;
    }
}

module.exports = function(opts) {
    return new TheApp().init(opts);
};