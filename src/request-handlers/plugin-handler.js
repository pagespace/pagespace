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

//support
var serveStatic = require('serve-static'),
    Promise = require('bluebird'),
    consts = require('../app-constants'),
    psUtil = require('../support/pagespace-util');

var reqTypes  = {
    STATIC: 'static',
    DATA: 'data',
    RESET: 'reset'
};

var PluginHandler = function() {
};

module.exports =  new PluginHandler();

PluginHandler.prototype.init = function(support) {

    this.logger = support.logger;
    this.pluginResolver = support.pluginResolver;
    this.dbSupport = support.dbSupport;
    this.reqCount = 0;

    this.staticServers = {};

    var self = this;
    return function(req, res, next) {
        return self.doRequest(req, res, next);
    };
};

/**
 * Process a valid request
 */
PluginHandler.prototype.doRequest = function(req, res, next) {

    var logger = psUtil.getRequestLogger(this.logger, req, 'plugins', ++this.reqCount);

    var reqInfo = consts.requests.PLUGINS.regex.exec(req.url);
    var reqType = reqInfo[1];
    var moduleId;

    if(reqType === reqTypes.DATA && (req.method === 'GET' || req.method === 'PUT')) {
        logger.info('New plugin data request');
        return this.doData(req, res, next, logger);
    } else if (reqType === reqTypes.STATIC && req.method === 'GET') {
        logger.info('New plugin static request');
        moduleId = reqInfo[2];
        var staticPath = reqInfo[3];
        return this.doStatic(req, res, next, logger, moduleId, staticPath);
    } else if (reqType === reqTypes.RESET) {
        logger.info('New delete cache request');
        moduleId = reqInfo[2];
        return this.doReset(req, res, next, logger, moduleId);
    } else {
        var err = new Error('Unrecognized method');
        err.status = 405;
        next(err);
    }
};

PluginHandler.prototype.doData = function(req, res, next, logger) {

    var self = this;

    logger.info('New data request from %s', req.user.username);

    var pageId = req.query.pageId;
    var regionName = req.query.region;
    var includeIndex = parseInt(req.query.include);

    var filter = {
        _id: pageId
    };

    var Page = this.dbSupport.getModel('Page');
    var query = Page.findOne(filter).populate('regions.includes.plugin');
    var findPage = Promise.promisify(query.exec, query);
    findPage().then(function(page) {
        //get data for region
        var region = page.regions.filter(function(region) {
            return region.name === regionName;
        })[0];

        var pluginPromise = null;
        var pluginId = region.includes[includeIndex].plugin ? region.includes[includeIndex].plugin.module : null;
        var pluginModule = self.pluginResolver.require(pluginId);

        if(pluginModule) {
            if(req.method === 'GET') {
                pluginPromise = region.includes[includeIndex].data;
            } else if(req.method === 'PUT') {
                pluginPromise = req.body;
            } else {
                var err = new Error('Unsupported method');
                err.status = 405;
                throw err;
            }
        }

        return [ page, pluginPromise ];
    }).spread(function(page, pluginData) {
        if(req.method === 'PUT') {
            var region = page.regions.filter(function(region) {
                return region.name === regionName;
            })[0];

            region.includes[includeIndex].data = pluginData;
            page.draft = true;
            page.markModified('regions');
            page.save(function (err) {
                if (err) {
                    logger.error(err, 'Error saving data');
                    throw err;
                }
                logger.info('Data request OK');
                res.statusCode = 204;
                res.send();
            });
        } else {
            logger.info('Data request OK');
            res.json(pluginData);
        }
    }).catch(function(err) {
        logger.error(err, 'Data request failed');
        next(new Error(err));
    });
};

PluginHandler.prototype.doStatic = function(req, res, next, logger, pluginModuleId, pluginStaticPath) {

    if(!this.staticServers[pluginModuleId]) {
        var pluginModule = this.pluginResolver.require(pluginModuleId);
        if(!pluginModule) {
            var err = new Error('Cannot resolve plugin module for %s', pluginModuleId);
            err.url = req.url;
            err.status = 404;
            return next();
        }
        this.staticServers[pluginModuleId] = serveStatic(pluginModule.__dir, {
            index: false
        });
    }
    req.url = '/static/' + pluginStaticPath;
    this.staticServers[pluginModuleId](req, res, function (e) {
        req.url = req.originalUrl;
        next(e);
    });
};

PluginHandler.prototype.doReset = function(req, res, next, logger, moduleId) {

    var pluginModule = this.pluginResolver.require(moduleId);

    var err;
    if(pluginModule && typeof pluginModule.reset === 'function') {
        var cacheKey = req.query.cacheKey || null;
        pluginModule.reset(cacheKey);
        logger.info('Cache delete request OK');
        res.status = 200;
        return res.json({
            message: 'Plugin module cache cleared'
        });
    } else if(pluginModule && typeof pluginModule.reset !== 'function') {
        err = new Error('Plugin module does not implement a reset method');
        err.status = 501;
        return next(err);
    } else {
        err = new Error('Plugin module does not exist');
        err.status = 404;
        return next(err);
    }
};