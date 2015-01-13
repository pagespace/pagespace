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
    this.adminStaticServe = serveStatic(__dirname + '/../../admin', {
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

    logger.debug('Processing static request for %s', req.url);

    var apiInfo = consts.requests.STATIC.regex.exec(req.url);
    var staticType = apiInfo[1];
    var staticPath = apiInfo[2];

    req.url = '/' + staticType + '/' + staticPath;
    this.adminStaticServe(req, res, function(e) {
        req.url = req.originalUrl;
        next(e);
    });

};