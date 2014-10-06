module.exports = {
    TAB: '\t',

    requestTypes: {
        PAGE: 0,
        REST: 1,
        ADMIN: 2,
        LOGIN: 3,
        OTHER: 4
    },

    appStates: {
        NOT_READY: 0,
        READY: 1
    },

    requestRegex: {
        API: new RegExp('^/_api/(pages|parts|templates|users|part-instances)/?(.*)'),
        ADMIN: new RegExp('^/_admin/(dashboard)/?(.*)'),
        LOGIN: new RegExp('^/_(login)')
    }
};