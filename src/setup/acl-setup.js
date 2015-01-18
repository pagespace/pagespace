/**
 * Copyright © 2015, Philip Mander
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

var createAcl = require('../misc/acl').acl,
    consts = require('../app-constants');

//url patterns
var ALL_REGEX = new RegExp('.*');
var DEV_API_REGEX = new RegExp('^/_api/(parts|templates)/?(.*)');
var EDITOR_API_REGEX = new RegExp('^/_api/(sites|pages|media)/?(.*)');

//actions
var GET = 'GET', PUT = 'PUT', POST = 'POST', DELETE = 'DELETE';
var ALL_ACTIONS = [ GET, POST, PUT, DELETE ];

//users
var admin = 'admin', developer = 'developer', editor = 'editor', guest = 'guest';

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
    acl.match(ALL_REGEX, [ GET, POST ]).thenOnlyAllow([ editor, developer, admin, guest]);

    //common actions requiring auth
    acl.match(consts.requests.MEDIA.regex, [ POST, PUT ]).thenOnlyAllow([ editor, developer, admin ]);
    acl.match(consts.requests.DATA.regex, ALL_ACTIONS).thenOnlyAllow([ editor, developer, admin ]);
    acl.match(consts.requests.PUBLISH.regex, ALL_ACTIONS).thenOnlyAllow([ editor, developer, admin ]);
    acl.match(consts.requests.DASHBOARD.regex, ALL_ACTIONS).thenOnlyAllow([ editor, developer, admin ]);
    acl.match(consts.requests.CACHE.regex, ALL_ACTIONS).thenOnlyAllow([ editor, developer, admin ]);

    //api
    acl.match(consts.requests.API.regex, [ PUT, POST, DELETE ]).thenOnlyAllow([ admin ]);
    acl.match(DEV_API_REGEX, ALL_ACTIONS).thenOnlyAllow([ developer, admin ]);
    acl.match(EDITOR_API_REGEX, ALL_ACTIONS).thenOnlyAllow([ editor, developer, admin ]);
    acl.match(consts.requests.API.regex, [ GET ]).thenOnlyAllow([ admin, developer, editor ]);

    return acl;
};