'use strict';

var consts = {
    TAB: '\t',

    appStates: {
        NOT_READY: 0,
        READY: 1
    },
    DEFAULT_SITE_ID: '1'
};
module.exports = consts;

consts.requests = {
    PAGE: {
        key: 'PAGE',
        regex: null,
        handler: require('./request-handlers/page-handler')
    },
    LOGIN: {
        key: 'LOGIN',
        regex: new RegExp('^/_(login)'),
        handler: require('./request-handlers/login-handler')
    },
    LOGOUT: {
        key: 'LOGOUT',
        regex: new RegExp('^/_(logout)'),
        handler: require('./request-handlers/logout-handler')
    },
    DASHBOARD: {
        key: 'DASHBOARD',
        regex: new RegExp('^/_(dashboard)'),
        handler: require('./request-handlers/dashboard-handler')
    },
    API: {
        key: 'API',
        regex: new RegExp('^/_api/(sites|pages|parts|templates|users|media)/?(.*)'),
        handler: require('./request-handlers/api-handler')
    },
    DATA: {
        key: 'DATA',
        regex: new RegExp('^/_data/(.+)/(.+)'),
        handler: require('./request-handlers/data-handler')
    },
    MEDIA: {
        key: 'MEDIA',
        regex: new RegExp('^/_media/?(.*)'),
        handler: require('./request-handlers/media-handler')
    },
    PUBLISH: {
        key: 'PUBLISH',
        regex: new RegExp('^/_publish/(pages)'),
        handler: require('./request-handlers/publishing-handler')
    },
    STATIC: {
        key: 'STATIC',
        regex: new RegExp('^/_static/(dashboard|bar|bower_components|parts)/(.*)'),
        handler: require('./request-handlers/static-handler')
    },
    OTHER: {
        key: 'OTHER',
        regex: null
    }
};