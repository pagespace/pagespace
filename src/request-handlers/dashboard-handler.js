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

var psUtil = require('../misc/pagespace-util');

/**
 *
 * @constructor
 */
var DashboardHandler = function(support) {
    this.logger = support.logger;
    this.reqCount = 0;
};

module.exports = function(support) {
    return new DashboardHandler(support);
};

/**
 *
 * @param req
 * @param res
 * @param next
 * @returns {*}
 */
DashboardHandler.prototype.doRequest = function(req, res, next) {

    var logger = psUtil.getRequestLogger(this.logger, req, 'dashboard', ++this.reqCount);

    logger.info('New dashboard request from %s', req.user.username);

    var pageData = {
        role: req.user.role,
        username: req.user.username
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