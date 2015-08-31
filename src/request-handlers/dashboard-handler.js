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

var Promise = require('bluebird'),

    psUtil = require('../misc/pagespace-util'),
    consts = require('../app-constants');

/**
 *
 * @constructor
 */
var DashboardHandler = function() {
};

module.exports = new DashboardHandler();

DashboardHandler.prototype.init = function(support) {

    this.logger = support.logger;
    this.viewEngine = support.viewEngine;
    this.userBasePath = support.userBasePath;
    this.dbSupport = support.dbSupport;
    this.partResolver = support.partResolver;

    this.reqCount = 0;

    this.staticServers = {};

    var self = this;
    return function(req, res, next) {
        return self.doRequest(req, res, next);
    };
};

/**
 *
 * @param req
 * @param res
 * @param next
 * @returns {*}
 */
DashboardHandler.prototype.doRequest = function(req, res, next) {

    var logger = psUtil.getRequestLogger(this.logger, req, 'templates', ++this.reqCount);

    var reqInfo = consts.requests.DASHBOARD.regex.exec(req.url);
    var reqType = reqInfo[1];

    if(!reqType && req.method === 'GET') {
        logger.info('New dashboard request');
        return this.doDashboard(req, res, next, logger);
    } else if (reqType === 'region' && req.method === 'GET') {
        logger.info('New part editor request');
        return this.doRegion(req, res, next, logger);
    } else {
        var err = new Error('Unrecognized method');
        err.status = 405;
        next(err);
    }
};

DashboardHandler.prototype.doDashboard = function(req, res, next, logger) {
    logger.info('New dashboard request from %s', req.user.username);

    var pageData = {
        username: req.user.username,
        displayName: req.user.name,
        allowUsers: req.user.role === 'admin',
        allowTemplatesAndParts: req.user.role === 'developer' || req.user.role === 'admin',
        year: new Date().toISOString().substr(0, 4)
    };

    return res.render('dashboard.hbs', pageData, function(err, html) {
        if(err) {
            logger.error(err, 'Error trying to render dashboard page, %s', req.url);
            next(err);
        } else {
            logger.info('Dashboard request OK');
            res.send(html);
        }
    });
};

DashboardHandler.prototype.doRegion = function(req, res, next, logger) {

    var self = this;

    logger.info('New dashboard request from %s', req.user.username);

    //get page id
    var pageId = req.query.pageId;

    //get region id
    var regionName = req.query.region;

    //lookup page
    var Page = this.dbSupport.getModel('Page', null);
    var filter = {
        _id: pageId
    };
    var query = Page.findOne(filter).populate('regions regions.part'); //clean up
    var findPage = Promise.promisify(query.exec, query);
    findPage().then(function(page) {

        var region = page.regions.filter(function(region) {
            return region.name === regionName;
        })[0];

        var partModule = self.partResolver.require(region.part ? region.part.module : null);
        if(partModule && typeof partModule.process === 'function') {
            var regionData = region.data || {};

            var regionDataResult = partModule.process(regionData , {
                basePath: self.userBasePath,
                PageModel: Page,
                req: req,
                logger: logger.child({part: region.part.name})
            });

            return [ partModule, region.name, regionDataResult ];
        } else {
            var noPartError = new Error('Could not find the part of region at page %s/$s', pageId, regionName);
            noPartError.status = 404;
            throw noPartError;
        }
    }).spread(function(partModule, regionName, regionData) {

        var rendarData = {
            data: regionData,
            region: regionName,
            pageId: pageId,
            __template: 'region'
        };

        self.viewEngine.registerPartial('region', partModule.__editPartial, 'region');

        return res.render('edit-region.hbs', rendarData, function(err, html) {
            if(err) {
                logger.error(err, 'Error trying to render region editor, %s', req.url);
                next(err);
            } else {
                logger.info('Region editor request OK');
                res.send(html);
            }
        });
    }).catch(function(err) {
        logger.error(err);
        next(err);
    });
};