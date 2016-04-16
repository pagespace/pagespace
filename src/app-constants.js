/**
 * Copyright © 2016, Versatile Internet
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

module.exports = {
    TAB: '\t',

    appStates: {
        NOT_READY: 0,
        READY: 1,
        FAILED: 3,
        STOPPED: 4
    },
    GUEST_USER: {
        username: 'guest',
        role: 'guest'
    },
    DEFAULT_LOCALE: 'en',
    DEFAULT_PLUGIN_CACHE_TTL: 60 * 10, //10 minutes
    
    DEFAULT_IMAGE_VARIATIONS: [{
        label: 'thumb',
        size: 200
    }, {
        label: 'large',
        size: 1000
    }]
};