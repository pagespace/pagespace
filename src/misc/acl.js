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

var Acl = function() {
    this.permissions = [];
};


Acl.prototype.allow = function(roles, resource, actions) {

    this.permissions.push({
        roles: roles,
        resourcePattern: new RegExp(resource),
        actions: actions
    });
};

/**
 * Loops through the acls in order added looking for a resource pattern match.
 * Grants permission if the role is found
 * @param role
 * @param resource
 * @param action
 * @returns {boolean}
 */
Acl.prototype.isAllowed = function(role, resource, action) {

    var permission, i;
    for(i = this.permissions.length - 1; i >= 0; i--) {
        permission = this.permissions[i];
        if(permission.resourcePattern.test(resource) && permission.actions.indexOf(action) > -1) {
            return permission.roles.indexOf(role) > -1;
        }
    }

    return false;
};


module.exports = Acl;