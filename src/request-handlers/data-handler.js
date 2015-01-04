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

//support
var Promise = require('bluebird'),
    consts = require('../app-constants'),
    psUtil = require('../misc/pagespace-util');

var DataHandler = function(support) {

    this.logger = support.logger;
    this.partResolver = support.partResolver;
    this.dbSupport = support.dbSupport;
    this.reqCount = 0;
};

module.exports = function(support) {
    return new DataHandler(support);
};

/**
 * Process a valid request
 */
DataHandler.prototype.doRequest = function(req, res, next) {

    var self = this;
    var logger = psUtil.getRequestLogger(this.logger, req, 'data', ++this.reqCount);

    logger.info('New data request from %s', req.user.username);

    var dataInfo = consts.requests.DATA.regex.exec(req.url);
    var pageId = dataInfo[1];
    var regionId = dataInfo[2];

    var filter = {
        _id: pageId
    };

    var Page = this.dbSupport.getModel('Page');
    var query = Page.findOne(filter).populate('regions.part');
    var findPage = Promise.promisify(query.exec, query);
    findPage().then(function(page) {
        //get data for region
        var region = page.regions.filter(function(region) {
            return region.name === regionId;
        })[0];

        var partPromise = null;
        var partModule = self.partResolver.require(region.part ? region.part.module : null);

        if(partModule) {
            if(req.method === 'GET') {
                partPromise = partModule.process(region.data);
            } else if(req.method === 'PUT') {
                partPromise = req.body;
            } else {
                var err = new Error('Unsupported method');
                err.status = 405;
                throw err;
            }
        }

        return [ page, region, partPromise ];
    }).spread(function(page, region, partData) {
        if(req.method === 'PUT') {
            region.data = partData.data;
            page.draft = true;
            page.save(function (err) {
                if (err) {
                    //TOOD: promisify, this won't work
                    logger.error(err, 'Error saving data');
                    throw err;
                }
                logger.info('Data request OK');
                res.statusCode = 204;
                res.send();
            });
        } else {
            logger.info('Data request OK');
            res.json(partData);
        }
    }).catch(function(err) {
        logger.error(err, 'Data request failed');
        next(new Error(err));
    });
};