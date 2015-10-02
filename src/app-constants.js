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

var consts = {
    TAB: '\t',

    appStates: {
        NOT_READY: 0,
        READY: 1,
        FAILED: 3
    },
    DEFAULT_SITE_ID: '1',
    GUEST_USER: {
        username: 'guest',
        role: 'guest'
    }
};

module.exports = consts;

consts.requests = {
    API: {
        key: 'API',
        regex: new RegExp('^/_api/(sites|pages|plugins|templates|users|media)/?(.*)'),
        handler: require('./request-handlers/api-handler')
    },
    AUTH: {
        key: 'AUTH',
        regex: new RegExp('^/_auth/(login|logout)'),
        handler: require('./request-handlers/auth-handler')
    },
    DASHBOARD: {
        key: 'DASHBOARD',
        regex: new RegExp('^/_dashboard/?(inpage)?'),
        handler: require('./request-handlers/dashboard-handler')
    },
    MEDIA: {
        key: 'MEDIA',
        regex: new RegExp('^/_media/?(.*)'),
        handler: require('./request-handlers/media-handler')
    },
    PAGE: {
        key: 'PAGE',
        regex: null,
        handler: require('./request-handlers/page-handler')
    },
    PLUGINS: {
        key: 'PLUGINS',
        regex: new RegExp('^/_plugins/(static|data|reset)/?([A-z0-9-_]*)/?(.*)'),
        handler: require('./request-handlers/plugin-handler')
    },
    PUBLISH: {
        key: 'PUBLISH',
        regex: new RegExp('^/_publish/(pages)'),
        handler: require('./request-handlers/publishing-handler')
    },
    STATIC: {
        key: 'STATIC',
        regex: new RegExp('^/_static/(dashboard|inpage|bower_components)/(.*)'),
        handler: require('./request-handlers/static-handler')
    },
    TEMPLATES: {
        key: 'TEMPLATES',
        regex: new RegExp('^/_templates/(available|template-regions|test|preview)'),
        handler: require('./request-handlers/templates-handler')
    },
    OTHER: {
        key: 'OTHER',
        regex: null
    }
};