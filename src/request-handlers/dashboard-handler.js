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

var psUtil = require('../misc/pagespace-util'),
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
    this.pluginResolver = support.pluginResolver;

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
        allowTemplatesAndPlugins: req.user.role === 'developer' || req.user.role === 'admin',
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