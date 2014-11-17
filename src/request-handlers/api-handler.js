"use strict";

//support
var bunyan = require('bunyan');

var events = require('events');
var nodeUtil = require('util');

//schemas
var pageSchema = require('../schemas/page');
var templateSchema = require('../schemas/template');
var partSchema = require('../schemas/part');
var userSchema = require('../schemas/user');

//util
var consts = require('../app-constants');
var util = require('../misc/util');
var logger =  bunyan.createLogger({ name: 'api-handler' });
logger.level(GLOBAL.logLevel);

var TAB = '\t';

var ApiHandler = function(modelFactory) {
    this.modelFactory = modelFactory;
};
nodeUtil.inherits(ApiHandler, events.EventEmitter);

module.exports = function(modelFactory) {
    return new ApiHandler(modelFactory);
};

ApiHandler.prototype.doRequest = function(req, res, next) {

    var self = this;

    logger.info('Processing api request for ' + req.url);

    var modelMap = {
        pages: {
            modelName: 'Page',
            schema: pageSchema
        },
        parts: {
            modelName: 'Part',
            model: partSchema
        },
        templates: {
            modelName: 'Template',
            model: templateSchema
        },
        users: {
            modelName: 'User',
            model: userSchema
        }
    };

    var populationsMap = {
        pages: 'parent template regions.part',
        parts: '',
        templates: '',
        users: ''
    };

    var apiInfo = consts.requestMeta.API.regex.exec(req.url);
    var apiType = apiInfo[1];
    var itemId = apiInfo[2];
    if(modelMap.hasOwnProperty(apiType)) {
        var schema = modelMap[apiType].schema;
        var modelName = modelMap[apiType].modelName;
        var Model = this.modelFactory.getModel(modelName, schema);

        //clear props not to overwrite
        delete req.body._id;
        delete req.body.__v;

        if(req.method === 'GET') {
            var filter = {};
            if(itemId) {
                filter._id = itemId;
                logger.debug('Searching for items by id [%s]: ' + modelName, itemId);
            } else {
                logger.debug('Searching for items in model: ' + modelName);
            }

            //create a filter out of the query string
            for(var p in req.query) {
                if(req.query.hasOwnProperty(p)) {
                    filter[p] = util.typeify(req.query[p]);
                }
            }

            var populations = populationsMap[apiType];
            Model.find(filter).populate(populations).exec(function(err, results) {
                if(err) {
                    logger.error(err, 'Trying to do API GET for %s', apiType);
                    return next(err);
                } else {
                    logger.info('Sending response for %s', req.url);
                    results =  itemId ? results[0] : results;
                    if(req.headers.accept.indexOf('application/json') === -1) {
                        var html = util.htmlStringify(results);
                        return res.send(html, {
                            'Content-Type' : 'text/html'
                        }, 200);
                    } else {
                        return res.json(results);
                    }
                }
            });
        } else if(req.method === 'POST') {
            if(itemId) {
                logger.warn('Cannot POST for this url. It shouldn\'t contain an id [%s]', itemId);
                next();
            } else {
                logger.info('Creating new %s', modelName);
                logger.debug('Creating new model with data: ' );
                logger.debug(TAB + req.body);
                var model = new Model(req.body);
                model.save(function(err, model) {
                    if(err) {
                        logger.error(err, 'Trying to save for API POST for %s', apiType);
                        next(err);
                    } else {
                        logger.info('Created successfully');
                        res.json(model);

                        //emit events
                        if(modelName === modelMap.pages.modelName) {
                            self.emit(consts.events.PAGES_UPDATED);
                        }
                    }
                });
            }
        } else if(req.method === 'PUT') {
            if(!itemId) {
                logger.warn('Cannot PUT for this url. It should contain an id');
                next();
            } else {
                logger.info('Updating %s with id [%s]', modelName, itemId);
                logger.debug('Updating model with data: ' );
                logger.debug(TAB + req.body);
                Model.findByIdAndUpdate(itemId, { $set: req.body }, function (err, model) {
                    if (err) {
                        logger.error(err, 'Trying to save for API PUT for %s', apiType);
                        next(err);
                    } else {
                        logger.info('Updated successfully');
                        res.json(model);

                        //emit events
                        if(modelName === modelMap.pages.modelName) {
                            self.emit(consts.events.PAGES_UPDATED);
                        }
                    }
                });
            }
        } else if(req.method === 'DELETE') {
            if (!itemId) {
                logger.warn('Cannot DELETE for this url. It should contain an id');
                next();
            } else {
                logger.info('Removing %s with id [%s]', modelName, itemId);
                Model.findByIdAndRemove(itemId, function (err) {
                    if (err) {
                        logger.error(err, 'Trying to do API DELETE for %s', apiType);
                        next(err);
                    } else {
                        logger.info('Deleted successfully');
                        res.statusCode = 204;
                        res.send();

                        //emit events
                        if(modelName === modelMap.pages.modelName) {
                            self.emit(consts.events.PAGES_UPDATED);
                        }
                    }
                });
            }
        } else {
            var err = new Error('Unrecognized method');
            err.status = 405;
            next(err);
        }
    }
};