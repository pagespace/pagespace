//support
var bunyan = require('bunyan');
var util = require('../util');
var hbs = require('hbs');

//models
var Page = require('../models/page');
var Template = require('../models/template');
var Part = require('../models/part');
var PartInstance = require('../models/part-instance');
var User = require('../models/user');

//util
var consts = require('../app-constants');
var logger =  bunyan.createLogger({ name: 'api-handler' });
logger.level('debug');

var ApiHandler = function() {
};

module.exports = function() {
    return new ApiHandler();
};

ApiHandler.prototype.doRequest = function(req, res, next) {

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
        "part-instances": {
            collection: 'partInstance',
            model: PartInstance
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
        pages: 'parent template regions.partInstance',
        parts: '',
        "part-instances": 'part',
        templates: '',
        users: ''
    };

    var apiInfo = consts.requestRegex.API.exec(req.url);
    var apiType = apiInfo[1];
    var itemId = apiInfo[2];
    if(collectionMap.hasOwnProperty(apiType)) {
        var Model = collectionMap[apiType].model;
        var collection = collectionMap[apiType].collection;
        var filter = {};
        if(itemId) {
            delete req.body._id;
            delete req.body.__v;
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
            var populations = populations[apiType];
            Model['find'](filter).populate(populations).exec(function(err, results) {
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
                logger.debug(TAB + req.body);
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
                logger.debug(TAB + req.body);
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