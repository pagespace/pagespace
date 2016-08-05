'use strict';

//deps
const 
    createAcl = require('a-seal');

//url patterns
const 
    ALL_PAGES = new RegExp('^/(?!_)(.*)'),
    DEV_API_REGEX = new RegExp('^/_api/(templates|macros)/?(.*)'),
    EDITOR_API_REGEX = new RegExp('^/_api/(sites|pages|includes|media)/?(.*)'),
    LOGIN = new RegExp('^/_auth/login'),
    LOGOUT = new RegExp('^/_auth/logout'),
    FORGOT_PASSWORD = new RegExp('^/_auth/forgot-password'),
    RESET_PASSWORD = new RegExp('^/_auth/reset-password');

//actions
const 
    GET = 'GET', 
    PUT = 'PUT', 
    POST = 'POST', 
    DELETE = 'DELETE', 
    ALL_ACTIONS = [ GET, POST, PUT, DELETE ];

//users
const 
    ADMIN = 'admin', 
    DEVELOPER = 'developer', 
    EDITOR = 'editor', 
    GUEST = 'guest',
    ALL_ROLES = [ ADMIN, DEVELOPER, EDITOR, GUEST ];

module.exports = function(middlwareMap) {

    const acl = createAcl();

    //all
    acl.match(ALL_PAGES).for(ALL_ACTIONS).thenAllow(ALL_ROLES);
    acl.match(middlwareMap.get('static').pattern).for(ALL_ACTIONS).thenAllow(ALL_ROLES);
    acl.match(middlwareMap.get('media').pattern).for(ALL_ACTIONS).thenAllow(ALL_ROLES);

    //auth
    acl.match(LOGIN).for(GET, POST).thenAllow(GUEST);
    acl.match(FORGOT_PASSWORD).for(POST).thenAllow(GUEST);
    acl.match(RESET_PASSWORD).for(POST).thenAllow(GUEST);
    acl.match(LOGOUT).for(GET).thenAllow(EDITOR, DEVELOPER, ADMIN);

    //common actions requiring auth
    acl.match(middlwareMap.get('media').pattern).for(POST, PUT).thenAllow(EDITOR, DEVELOPER, ADMIN);
    acl.match(middlwareMap.get('templates').pattern).for(GET).thenAllow(EDITOR, DEVELOPER, ADMIN);
    acl.match(middlwareMap.get('publishing').pattern).for(POST, PUT).thenAllow(EDITOR, DEVELOPER, ADMIN);
    acl.match(middlwareMap.get('dashboard').pattern).for(GET).thenAllow(EDITOR, DEVELOPER, ADMIN);

    //api
    acl.match(middlwareMap.get('api').pattern).for(PUT, POST, DELETE).thenAllow(ADMIN);
    acl.match(EDITOR_API_REGEX).for(PUT, POST, DELETE).thenAllow(EDITOR, DEVELOPER, ADMIN);
    acl.match(DEV_API_REGEX).for(PUT, POST, DELETE).thenAllow(DEVELOPER, ADMIN);
    acl.match(middlwareMap.get('api').pattern).for(GET).thenAllow(ADMIN, DEVELOPER, EDITOR);

    return acl;
};