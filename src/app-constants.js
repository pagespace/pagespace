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