/**
 * Copyright © 2015, Versatile Internet
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

var util = require('util'),
    consts = require('../app-constants'),
    psUtil = require('../support/pagespace-util');

//maps model ur namel parts to model names
var modelMap = {
    sites: 'Site',
    pages: 'Page',
    plugins: 'Plugin',
    templates:'Template',
    users: 'User',
    media: 'Media',
    hits: 'Hit'
};

//fields to auto populate when making queries to these model names (the keys)
var populationsMap = {
    Site: '',
    Page: 'parent template regions.includes.plugin redirect createdBy updatedBy',
    Plugin: '',
    Template: 'regions.includes.plugin',
    User: '',
    Media: '',
    Hit: ''
};

var ApiHandler = function() {};

module.exports = new ApiHandler();

/**
 * Initialize the API middleware
 * @param support
 * @returns {Function}
 */
ApiHandler.prototype.init = function(support) {

    this.logger = support.logger;
    this.dbSupport = support.dbSupport;
    this.reqCount = 0;

    var self = this;
    return function(req, res, next) {
        return self.doRequest(req, res, next);
    };
};

/**
 * Handle API requests
 * @param req
 * @param res
 * @param next
 */
ApiHandler.prototype.doRequest = function(req, res, next) {

    var logger = psUtil.getRequestLogger(this.logger, req, 'api', ++this.reqCount);

    logger.info('New api request');

    var apiInfo = consts.requests.API.regex.exec(req.url);
    var apiType = apiInfo[1];
    var itemId = apiInfo[2];

    //can now process the supported api type
    if(modelMap.hasOwnProperty(apiType)) {
        var modelName = modelMap[apiType];
        var Model = this.dbSupport.getModel(modelName);

        //clear props not to write to db
        delete req.body._id;
        delete req.body.__v;

        //map a http method to a function to call
        var methodMapping = {
            GET : 'doGet',
            POST : 'doCreate',
            PUT: 'doUpdate',
            DELETE: 'doDelete'
        };

        var fnName = methodMapping[req.method.toUpperCase()];
        if(fnName) {
            this[fnName](req,res, next, logger, Model, itemId);
        } else {
            var err = new Error('Unrecognized method');
            err.status = 405;
            next(err);
        }
    }
};

/**
 * Get from the DB
 * @param req
 * @param res
 * @param next
 * @param logger
 * @param Model
 * @param itemId
 */
ApiHandler.prototype.doGet = function get(req, res, next, logger, Model, itemId) {
    var filter = {};
    if (itemId) {
        filter._id = itemId;
        logger.debug('Searching for items by id [%s]: %s', itemId, Model.modelName);
    } else {
        logger.debug('Searching for items in model: %s', Model.modelName);
    }

    //create a filter from the query string
    for (var p in req.query) {
        //use __ prefix to stop special query params being included in filter
        if (req.query.hasOwnProperty(p) && p.indexOf('__') !== 0) {
            filter[p] = psUtil.typeify(req.query[p]);
        }
    }

    var populations = psUtil.typeify(req.query.__nopop) ? '' : populationsMap[Model.modelName];
    Model.find(filter, '-__v').populate(populations).sort('-createdAt').then(function (results) {
        logger.info('API request OK in %s ms', Date.now() - req.startTime);
        results = itemId ? results[0] : results;
        if (req.headers.accept && req.headers.accept.indexOf('application/json') === -1) {
            var html = psUtil.htmlStringify(results);
            res.send(html, {
                'Content-Type': 'text/html'
            }, 200);
        } else {
            res.json(results);
        }
    }).then(undefined, function (err) {
        logger.error(err, 'Error trying API GET for %s', Model.modelName);
        next(err);
    });
};

/**
 * Create a doc in the DB
 * @param req
 * @param res
 * @param next
 * @param logger
 * @param Model
 * @param itemId
 */
ApiHandler.prototype.doCreate = function create(req, res, next, logger, Model, itemId) {
    if (itemId) {
        var message = util.format('Cannot POST for this url. It should not contain an id [%s]', itemId);
        logger.warn(message);
        var err = new Error(message);
        err.status = 400;
        next(err);
    } else {
        logger.info('Creating new %s', Model.modelName);
        logger.debug('Creating new model with data: ');
        logger.debug(req.body);

        var docData = req.body;
        var model = new Model(docData);
        model.createdBy = req.user._id;
        model.save().then(function (model) {
            logger.info('API post OK in %s ms', Date.now() - req.startTime);
            res.status(201);
            res.json(model);
        }).then(undefined, function (err) {
            if(err.name === 'CastError' || err.name === 'ValidationError') {
                //it was the client's fault
                err.status = 400;
            }
            logger.error(err, 'Trying to save for API POST for %s', Model.name);
            next(err);
        });
    }
};

/**
 * Update a doc in the DB
 * @param req
 * @param res
 * @param next
 * @param logger
 * @param Model
 * @param itemId
 */
ApiHandler.prototype.doUpdate = function update(req, res, next, logger, Model, itemId) {
    if (!itemId) {
        var message = 'Cannot PUT for this url. It should contain an id';
        logger.warn(message);
        var err = new Error(message);
        err.status = 400;
        next(err);
    } else {
        logger.info('Updating %s with id [%s]', Model.modelName, itemId);
        logger.debug('Updating model with data: ');
        var docData = req.body;
        docData.updatedBy = req.user._id;
        this.draft = true;
        logger.debug(req.body);
        Model.findOneAndUpdate({_id: itemId}, docData, { 'new': true }).then(function (doc) {
            logger.info('API PUT OK in %s ms', Date.now() - req.startTime);
            res.json(doc);
        }).then(undefined, function (err) {
            if(err.name === 'CastError' || err.name === 'ValidationError') {
                //it was the client's fault
                err.status = 400;
            }
            logger.error(err, 'Trying to update for API PUT for %s', Model.modelName);
            next(err);
        });
    }
};

/**
 * Delete a doc in the DB
 * @param res
 * @param req
 * @param next
 * @param logger
 * @param Model
 * @param itemId
 */
ApiHandler.prototype.doDelete = function del(req, res, next, logger, Model, itemId) {
    if (!itemId) {
        var message = 'Cannot delete for this url. It should contain an id';
        logger.warn(message);
        var err = new Error(message);
        err.status = 400;
        next(err);
    } else {
        logger.info('Removing %s with id [%s]', Model.modelName, itemId);
        Model.findByIdAndRemove(itemId).then(function () {
            logger.info('API DELETE OK in %s ms', Date.now() - req.startTime);
            res.statusCode = 204;
            res.send();
        }).then(undefined, function (err) {
            if(err.name === 'CastError') {
                //it was the client's fault
                err.status = 400;
            }
            logger.error(err, 'Trying to do API DELETE for %s', Model.modelName);
            next(err);
        });
    }
};