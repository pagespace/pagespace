'use strict';

module.exports = Object.freeze({
    TAB: '\t',

    appStates: {
        NOT_READY: Symbol('not ready'),
        READY: Symbol('ready'),
        FAILED: Symbol('failed'),
        STOPPED: Symbol('stopped')
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
});