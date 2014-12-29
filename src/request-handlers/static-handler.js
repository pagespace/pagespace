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
 * along with Foobar.  If not, see <http://www.gnu.org/licenses/>.
 */

'use strict';

//support
var serveStatic = require('serve-static');

//util
var consts = require('../app-constants');

var StaticHandler = function(support) {
    this.logger = support.logger.child({module: 'static-handler'});
    this.adminStaticServe = serveStatic(__dirname + '/../../admin', { index: false });
};

module.exports = function(support) {
    return new StaticHandler(support);
};

StaticHandler.prototype._doRequest = function(req, res, next) {

    var logger = this.logger;

    logger.info('Processing static request for %s', req.url);

    var apiInfo = consts.requests.STATIC.regex.exec(req.url);
    var staticType = apiInfo[1];
    var staticPath = apiInfo[2];

    req.url = '/' + staticType + '/' + staticPath;
    this.adminStaticServe(req, res, function(e) {
        req.url = req.originalUrl;
        next(e);
    });

};