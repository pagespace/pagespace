"use strict";

var consts = {
    TAB: '\t',

    appStates: {
        NOT_READY: 0,
        READY: 1
    },

    events: {
        PAGES_UPDATED: 'pages-updated'
    }
};

consts.requests = {
    PAGE: 0,
    API: 1,
    ADMIN: 2,
    LOGIN: 3,
    LOGOUT: 4,
    PUBLISH: 5,
    OTHER: 99
};

consts.requestMeta = {
    PAGE: {
        regex: null
    },
    LOGIN: {
        type: consts.requests.LOGIN,
        regex: new RegExp('^/_(login)')
    },
    LOGOUT: {
        type: consts.requests.LOGOUT,
        regex: new RegExp('^/_(logout)')
    },
    ADMIN: {
        type: consts.requests.ADMIN,
        regex: new RegExp('^/_admin/(dashboard)/?(.*)')
    },
    API: {
        type: consts.requests.API,
        regex: new RegExp('^/_api/(pages|parts|templates|users)/?(.*)')
    },
    DATA: {
        type: consts.requests.DATA,
        regex: new RegExp('^/_data/(.+)/(.+)')
    },
    PUBLISH: {
        type: consts.requests.PUBLISH,
        regex: new RegExp('^/_publish/(pages)')
    },
    OTHER: {
        type: consts.requests.OTHER,
        regex: null
    }
};

module.exports = consts;