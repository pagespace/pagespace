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

var psUtil = require('../misc/pagespace-util');

var LogoutHandler = function() { };

module.exports = new LogoutHandler();

LogoutHandler.prototype.init = function(support) {

    this.logger = support.logger;
    this.reqCount = 0;

    var self = this;
    return function(req, res, next) {
        return self.doRequest(req, res, next);
    };
};

LogoutHandler.prototype.doRequest = function(req, res) {

    this.reqCount++;
    var logger = psUtil.getRequestLogger(this.logger, req, 'logout', ++this.reqCount);

    logger.info('New logout request');

    if(req.method === 'GET' || req.method === 'POST') {
        req.logout();
        res.clearCookie('remember_me');
        logger.info('Logout OK, redirecting to login page');
        return res.redirect('/_login');
    }
};
