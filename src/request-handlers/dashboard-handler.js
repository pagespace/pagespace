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

var DashboardHandler = function() {
};

module.exports = function() {
    return new DashboardHandler();
};

DashboardHandler.prototype._doRequest = function(req, res, next, logger) {

    logger.info('Processing admin request for %s', req.url);

    var pageData = {
        role: req.user.role,
        username: req.user.username
    };

    return res.render('dashboard.hbs', pageData, function(err, html) {
        if(err) {
            logger.error(err, 'Error trying to render dashboard page, %s', req.url);
            next(err);
        } else {
            logger.info('Sending page for %s', req.url);
            res.send(html);
        }
    });
};