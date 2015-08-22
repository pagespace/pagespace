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

var serveStatic = require('serve-static'),
    consts = require('../app-constants'),
    psUtil = require('../misc/pagespace-util');

var StaticHandler = function() {
};

module.exports = new StaticHandler();

StaticHandler.prototype.init = function(support) {

    this.logger = support.logger;
    this.partResolver = support.partResolver;

    //a collection of static servers for admin directories and page-part directories
    this.staticServers = {};
    this.staticServers.admin = serveStatic(__dirname + '/../../admin', {
        index: false
    });
    this.reqCount = 0;

    var self = this;
    return function(req, res, next) {
        return self.doRequest(req, res, next);
    };
};

StaticHandler.prototype.doRequest = function(req, res, next) {

    var logger = psUtil.getRequestLogger(this.logger, req, 'static', ++this.reqCount);

    logger.trace('Processing static request for %s', req.url);

    //serve admin static resources (/_static/dashboard/foo)
    var adminStaticInfo, partStaticInfo;
    if(adminStaticInfo = consts.requests.STATIC.regex.exec(req.url)) { // jshint ignore:line
        var staticType = adminStaticInfo[1];
        var adminStaticPath = adminStaticInfo[2];
        req.url = '/' + staticType + '/' + adminStaticPath;
        this.staticServers.admin(req, res, function (e) {
            req.url = req.originalUrl;
            next(e);
        });

    //serves static assets of part modules
    } else if(partStaticInfo = consts.requests.PART_STATIC.regex.exec(req.url)) { // jshint ignore:line

        var partModuleId = partStaticInfo[1];
        var partStaticPath = partStaticInfo[2];
        if(!this.staticServers[partModuleId]) {

            //TODO: this is a workaround while parts are not resolved as separate node modules
            var partModuleLookupId = './parts/' + partModuleId;
            var partModule = this.partResolver.require(partModuleLookupId);
            if(!partModule) {
                var err = new Error('Cannot resolve part module for %s', partModuleId);
                err.url = req.url;
                err.status = 404;
                return next();
            }
            this.staticServers[partModuleId] = serveStatic(partModule.__dir, {
                index: false
            });
        }
        req.url = '/static/' + partStaticPath;
        this.staticServers[partModuleId](req, res, function (e) {
            req.url = req.originalUrl;
            next(e);
        });
    } else {
        var err = new Error('Could not find static resource');
        err.url = req.url;
        err.status = 404;
        return next(err);
    }
};