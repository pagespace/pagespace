
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

var LogoutHandler = function(support) {
    this.logger = support.logger.child({module:'logout-handler'});
};

module.exports = function(support) {
    return new LogoutHandler(support);
};

LogoutHandler.prototype._doRequest = function(req, res) {

    var logger = this.logger;

    logger.info('Processing logout request for ' + req.url);

    if(req.method === 'GET' || req.method === 'POST') {
        req.logout();
        res.clearCookie('remember_me');
        return res.redirect('/_login');
    }
};