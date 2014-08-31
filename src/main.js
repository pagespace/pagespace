var mongoose = require('mongoose');
var hbs = require('hbs');
var pageResolver = require('./page-resolver')();
var logger = require('./logger')("debug");
var Promise = require('bluebird')
var Url = require('./models/url');
var Page = require('./models/page');
var Template = require('./models/template');
var Part = require('./models/part');
require('array.prototype.find');

var requestTypes = {
    PAGE: 0,
    REST: 1,
    OTHER: 3
};

var apiRegex = new RegExp('^/_api/(pages|parts|templates|urls)/?(.*)');

/**
 * The App
 * @constructor
 */
var TheApp = function() {

    this.urlsToResolve = [];
    this.ready = false;
    this.pageResolver = pageResolver;
};

/**
 * Initializes and returns the middleware
 */
TheApp.prototype.init = function(options) {

    var self = this;

    logger.info("Initializing the middleware");

    var readyPromises = [];

    var urlsDeferred = defer();
    readyPromises.push(urlsDeferred.promise);

    mongoose.connect('mongodb://localhost/test');
    var db = (this.db = mongoose.connection);
    db.on('error', console.error.bind(console, 'connection error:'));
    db.once('open', function callback () {
        logger.info("Db connection established");

        //get all the urls in the db
        Url.find({}, 'url', function(err, docs) {
            if(err) {
                urlsDeferred.reject();
            } else {
                self.urlsToResolve = docs.map(function(doc) {
                    return doc.url;
                });
                if(logger.isDebug()) {
                    logger.debug("Urls to resolve are:")
                    self.urlsToResolve.forEach(function(url) {
                        logger.append(url);
                    });
                }
                urlsDeferred.resolve();
            }
        });
    });

    this.templatesDir = options.templatesDir || null;
    this.parts = options.parts || [];

    var partsPromises = this.parts.map(function(part) {
        return part.init();
    });
    readyPromises.concat(partsPromises);

    Promise.all(readyPromises).then(function() {
        logger.info('Initalized, waiting for requests')
        self.ready = true;
    });

    return function(req, res, next) {

        if(self.ready) {
            var urlType = self.getUrlType(req.url)
            if(urlType === requestTypes.PAGE) {
                self.doPageRequest(req, res, next);
            } else if(urlType === requestTypes.REST) {
                self.doApiRequest(req, res, next);
            }

        } else {
            next();
        }
    }
};

/**
 * Process a valid request
 */
TheApp.prototype.doPageRequest = function(req, res, next) {

    var self = this;

    logger.info("Processing page request for " + req.url);

    self.pageResolver.findPage(req.url).then(function(page) {

        logger.info('Page found for ' + req.url + ': ' + page.id);

        var pageData = {};
        page.regions.forEach(function(region) {

            logger.log(region.module)

            var pageModule = region.module;

            var type = pageModule.type;
            var mod = self.parts.find(function(mod) {
                return mod.getType() === type;
            });

            pageData[region.region] = mod.read(pageModule.data, self.db);

            hbs.registerPartial(region.region, mod.userView);
        });

        res.render(page.template.src, pageData, function(err, html) {

            if(err) {
                logger.error(err);
                next();
            } else {
                res.send(html);
            }
        });

    }).catch(function(err) {
        console.log(err);
        next();
    });
};

TheApp.prototype.doApiRequest = function(req, res, next) {

    logger.info("Processing api request for " + req.url);

    var collectionMap = {
        urls: {
            collection: "url",
            model: Url
        },
        pages: {
            collection: "page",
            model: Page
        },
        parts: {
            collection: "part",
            model: Part
        },
        templates: {
            collections: "template",
            model: Template
        }
    };

    var apiInfo = apiRegex.exec(req.url);
    var apiType = apiInfo[1];
    var itemId = apiInfo[2];
    if(collectionMap.hasOwnProperty(apiType)) {
        var Model = collectionMap[apiType].model;
        var collection = collectionMap[apiType].collection;
        var filter = {};
        if(itemId) {
            filter._id = itemId;
            logger.debug("Searching for items by id [%s]: " + collection, itemId);
        } else {
            logger.debug("Searching for items in collection: " + collection);
        }

        if(req.method === "GET") {
            Model["find"](filter, collection, function(err, results) {
                if(err) {
                    logger.error(err);
                    next();
                } else {
                    res.json(itemId ? results[0] : results);
                }
            });
        } else if(req.method === "POST") {
            if(itemId) {
                logger.warn("Cannot POST for this url. It shouldn't contain an id [%s]", itemId);
                next();
            } else {
                logger.info("Creating new %s", collection);
                logger.debug("Creating new collection with data: " );
                logger.append(req.body);
                var model = new Model(req.body);
                model.save(function(err, model) {
                    res.json(model);
                });
            }
        } else if(req.method === "PUT") {
            if(!itemId) {
                logger.warn("Cannot PUT for this url. It should contain an id");
                next();
            } else {
                logger.info("Updating %s with id [%s]", collection, itemId);
                logger.debug("Updating collection with data: " );
                logger.append(req.body);
                Model.findByIdAndUpdate(itemId, { $set: req.body }, function (err, model) {
                    if (err) {
                        next();
                    } else {
                        res.json(model);
                    }
                });
            }
        } else if(req.method === "DELETE") {
            if (!itemId) {
                logger.warn("Cannot DELETE for this url. It should contain an id");
                next();
            } else {
                logger.info("Removing %s with id [%s]", collection, itemId);
                Model.findByIdAndRemove(itemId, function (err, model) {
                    if (err) {
                        next();
                    } else {
                        res.statusCode = 204;
                        res.send();
                    }
                });
            }
        }
    }
};

TheApp.prototype.getUrlType = function(url) {

    var type;

    if(this.urlsToResolve.indexOf(url) >= 0) {
        type = requestTypes.PAGE;
    } else if(apiRegex.test(url)) {
        type = requestTypes.REST;
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

module.exports = function(opts) {
    return new TheApp().init(opts);
};