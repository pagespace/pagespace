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

var serveStatic = require('serve-static'),
    consts = require('../app-constants'),
    psUtil = require('../support/pagespace-util');

var StaticHandler = function() {
};

module.exports = new StaticHandler();

StaticHandler.prototype.init = function(support) {

    this.logger = support.logger;
    this.pluginResolver = support.pluginResolver;
    this.adminStaticServer = serveStatic(__dirname + '/../../static', {
        index: false
    });
    this.pluginStaticServers = {};
    this.reqCount = 0;

    var self = this;
    return function(req, res, next) {
        return self.doRequest(req, res, next);
    };
};

StaticHandler.prototype.doRequest = function(req, res, next) {

    var logger = psUtil.getRequestLogger(this.logger, req, 'static', ++this.reqCount);

    logger.trace('Processing static request for %s', req.url);

    var apiInfo = consts.requests.STATIC.regex.exec(req.url);
    var staticType = apiInfo[1];
    var staticPath;
    if(staticType !== 'plugins') {
        staticPath = apiInfo[2] + (apiInfo[3] ? '/' + apiInfo[3] : '');
        req.url = '/' + staticType + '/' + staticPath;
        this.adminStaticServer(req, res, function(e) {
            req.url = req.originalUrl;
            next(e);
        });
    } else {
        var pluginModuleId = apiInfo[2];
        staticPath = apiInfo[3];
        if(!this.pluginStaticServers[pluginModuleId]) {
            var pluginModule = this.pluginResolver.require(pluginModuleId);
            if(!pluginModule) {
                var err = new Error('Cannot resolve plugin module for %s', pluginModuleId);
                err.url = req.url;
                err.status = 404;
                return next();
            }
            this.pluginStaticServers[pluginModuleId] = serveStatic(pluginModule.__dir, {
                index: false
            });
        }
        req.url = '/static/' + staticPath;
        this.pluginStaticServers[pluginModuleId](req, res, function (e) {
            req.url = req.originalUrl;
            next(e);
        });
    }
};