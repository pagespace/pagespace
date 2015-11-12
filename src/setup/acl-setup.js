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

var createAcl = require('../support/acl').acl,
    consts = require('../app-constants');

//url patterns
var ALL_PAGES = new RegExp('^/(?!_)(.*)');
var DEV_API_REGEX = new RegExp('^/_api/(plugins|templates)/?(.*)');
var EDITOR_API_REGEX = new RegExp('^/_api/(sites|pages|datas|media)/?(.*)');

var LOGIN = new RegExp('^/_auth/login');
var LOGOUT = new RegExp('^/_auth/logout');

//actions
var GET = 'GET', PUT = 'PUT', POST = 'POST', DELETE = 'DELETE';
var ALL_ACTIONS = [ GET, POST, PUT, DELETE ];

//users
var admin = 'admin', developer = 'developer', editor = 'editor', guest = 'guest';
var ALL_ROLES = [ admin, developer, editor, guest ];

/**
 *
 * @param opts
 * @constructor
 */
var AclSetup = function() {
};

module.exports = function() {
    return new AclSetup();
};

AclSetup.prototype.runSetup = function() {

    var acl = createAcl();

    //all
    acl.match(ALL_PAGES, ALL_ACTIONS).thenOnlyAllow(ALL_ROLES);
    acl.match(consts.requests.STATIC.regex, ALL_ACTIONS).thenOnlyAllow(ALL_ROLES);
    acl.match(consts.requests.MEDIA.regex, ALL_ACTIONS).thenOnlyAllow(ALL_ROLES);

    //auth
    acl.match(LOGIN, [ GET, POST ]).thenOnlyAllow([ guest ]);
    acl.match(LOGOUT, [ GET ]).thenOnlyAllow([ editor, developer, admin ]);

    //common actions requiring auth
    acl.match(consts.requests.MEDIA.regex, [ POST, PUT ]).thenOnlyAllow([ editor, developer, admin ]);
    acl.match(consts.requests.PLUGINS.regex, ALL_ACTIONS).thenOnlyAllow([ editor, developer, admin ]);
    acl.match(consts.requests.TEMPLATES.regex, ALL_ACTIONS).thenOnlyAllow([ editor, developer, admin ]);
    acl.match(consts.requests.PUBLISH.regex, ALL_ACTIONS).thenOnlyAllow([ editor, developer, admin ]);
    acl.match(consts.requests.DASHBOARD.regex, ALL_ACTIONS).thenOnlyAllow([ editor, developer, admin ]);

    //api
    acl.match(consts.requests.API.regex, [ PUT, POST, DELETE ]).thenOnlyAllow([ admin ]);
    acl.match(EDITOR_API_REGEX, [ PUT, POST, DELETE ]).thenOnlyAllow([ editor, developer, admin ]);
    acl.match(DEV_API_REGEX, [ PUT, POST, DELETE ]).thenOnlyAllow([ developer, admin ]);
    acl.match(consts.requests.API.regex, [ GET ]).thenOnlyAllow([ admin, developer, editor ]);

    return acl;
};