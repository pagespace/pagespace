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

var handlebars = require('handlebars'),
    consts = require('../app-constants');

module.exports = {

    /**
     * Attempts to coerce an intended type of a string value
     * @param value
     * @returns {*}
     */
    typeify: function typeify(value) {
        if(typeof value === 'undefined' || value === null) {
            return null;
        } else if(!isNaN(parseFloat(+value))) {
            return parseFloat(value);
        } else if(value.toLowerCase() === 'false') {
            return false;
        } else if(value.toLowerCase() === 'true') {
            return true;
        } else if(value.length > 2 && value.indexOf('/') === 0 && value.lastIndexOf('/') === value.length - 1) {
            return new RegExp(value.substring(1, value.length - 1));
        } else {
            return value;
        }
    },

    htmlStringify: function htmlStringify(obj) {
        var html =
            '<pre style="font-family: Consolas, \'Courier New\'">' +
                handlebars.escapeExpression(JSON.stringify(obj, null, 4)) +
            '</pre>';
        return html;
    },

    getRequestLogger: function getRequestLogger(logger, req, source, count) {
        return logger.child({
            sessionID: req.sessionID,
            reqId: source + '-' + count,
            url: req.url,
            method: req.method,
            role: req.user ? req.user.role : consts.GUEST_USER.role
        });
    }
};