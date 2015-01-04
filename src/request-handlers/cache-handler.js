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
var consts = require('../app-constants'),
    psUtil = require('../misc/pagespace-util');


var CacheHandler = function(support) {
    this.partResolver = support.partResolver;
    this.logger = support.logger;
    this.reqCount = 0;
};

module.exports = function(support) {
    return new CacheHandler(support);
};

CacheHandler.prototype.doRequest = function(req, res, next) {

    var logger = psUtil.getRequestLogger(this.logger, req, 'cache', ++this.reqCount);

    var apiInfo = consts.requests.CACHE.regex.exec(req.url);
    var cacheType = apiInfo[1];

    if(req.method === 'PUT' && cacheType === 'parts') {
        return this._resetPartModule(req, res, next, logger);
    } else {
        var err = new Error('Unsupported method');
        err.status = 405;
        return next(err);
    }
};

CacheHandler.prototype._resetPartModule = function(req, res, next, logger) {

    logger.info('New delete cache request');

    var moduleId = req.body.module;
    var partModule = this.partResolver.require(moduleId);

    var err;
    if(partModule && typeof partModule.reset === 'function') {
        var cacheKey = req.body.key || null;
        partModule.reset(cacheKey);
        logger.info('Cache delete request OK');
        res.status = 200;
        return res.send('Part module cache cleared');
    } else if(partModule && typeof partModule.reset !== 'function') {
        err = new Error('Part module does not implement a reset method');
        err.status = 501;
        return next(err);
    } else {
        err = new Error('Part module does not exist');
        err.status = 404;
        return next(err);
    }
};