/**
 * Copyright © 2015, Philip Mander
 *
 * This file is part of Pagespace.
 *
 * Pagespace is free software: you can redistribute it and/or modify
 * it under the terms of the Lesser GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Pagespace is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * Lesser GNU General Public License for more details.

 * You should have received a copy of the Lesser GNU General Public License
 * along with Pagespace.  If not, see <http://www.gnu.org/licenses/>.
 */

'use strict';

//util
var consts = require('../app-constants');
var util = require('../misc/util');

var ApiHandler = function(support) {
    this.dbSupport = support.dbSupport;
};

module.exports = function(support) {
    return new ApiHandler(support);
};

ApiHandler.prototype._doRequest = function(req, res, next, logger) {

    logger.info('Processing api request for %s ', req.url);

    var modelMap = {
        sites: 'Site',
        pages: 'Page',
        parts: 'Part',
        templates:'Template',
        users: 'User',
        media: 'Media'
    };

    var populationsMap = {
        sites: '',
        pages: 'parent template regions.part redirect',
        parts: '',
        templates: '',
        users: '',
        media: ''
    };

    var defaultRestrictedFields = [ '__v'];

    var restrictedFields = {
        sites: [],
        pages: [],
        parts: [],
        templates: [],
        users: [ 'password', 'updatePassword', 'rememberToken' ],
        media: [ 'path' ]
    };

    var apiInfo = consts.requests.API.regex.exec(req.url);
    var apiType = apiInfo[1];
    var itemId = apiInfo[2];
    if(modelMap.hasOwnProperty(apiType)) {
        var modelName = modelMap[apiType];
        var Model = this.dbSupport.getModel(modelName);

        //clear props not to overwrite
        delete req.body._id;
        delete req.body.__v;

        var docData;
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

            var restricted = restrictedFields[apiType].concat(defaultRestrictedFields).map(function(field) {
                return '-' + field;
            }).join(' ');
            var populations = populationsMap[apiType];
            Model.find(filter, restricted).populate(populations).sort('-createdAt').exec(function(err, results) {
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
                logger.debug(req.body);

                docData = req.body;
                docData.createdBy = req.user._id;
                var model = new Model(docData);
                model.save(function(err, model) {
                    if(err) {
                        logger.error(err, 'Trying to save for API POST for %s', apiType);
                        next(err);
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
                logger.info('Updating %s with id [%s]', modelName, itemId);
                logger.debug('Updating model with data: ' );
                docData = req.body;
                docData.updatedBy = req.user._id;
                this.draft = true;
                logger.debug(req.body);
                Model.findById(itemId, function (err, doc) {
                    if (err) {
                        logger.error(err, 'Trying to save for API PUT for %s', apiType);
                        next(err);
                    } else if(doc) {
                        //need to do this because findByIdAndUpdate does invoke mongoose hooks
                        //https://github.com/LearnBoost/mongoose/issues/964
                        for(var key in docData) {
                            if(docData.hasOwnProperty(key)) {
                                doc[key] = docData[key];
                            }
                        }

                        doc.save(function (err) {
                            if(err) {
                                logger.error(err, 'Trying to save for API PUT for %s', apiType);
                                next(err);
                            } else {
                                logger.info('Updated successfully');
                                res.json(model);
                            }
                        });
                    }
                });
                /*Model.findByIdAndUpdate(itemId, { $set: data }, function (err, model) {
                    if (err) {
                        logger.error(err, 'Trying to save for API PUT for %s', apiType);
                        next(err);
                    } else {
                        logger.info('Updated successfully');
                        res.json(model);
                    }
                });*/
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