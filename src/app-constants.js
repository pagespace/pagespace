"use strict";

module.exports = {
    TAB: '\t',

    requestTypes: {
        PAGE: 0,
        API: 1,
        ADMIN: 2,
        LOGIN: 3,
        LOGOUT: 4,
        OTHER: 99
    },

    appStates: {
        NOT_READY: 0,
        READY: 1
    },

    requestRegex: {
        API: new RegExp('^/_api/(pages|parts|templates|users|part-instances)/?(.*)'),
        DATA: new RegExp('^/_data/(.+)/(.+)'),
        ADMIN: new RegExp('^/_admin/(dashboard)/?(.*)'),
        LOGIN: new RegExp('^/_(login)'),
        LOGOUT: new RegExp('^/_(logout)')
    }
};