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
    this.rules = [];
};

module.exports.acl = function() {
    return new Acl();
};

module.exports.middleware = function(acl) {
    return function(req, res, next) {
        var isAllowed = false;
        var err;
        if(req.user && req.user.role) {
            isAllowed = acl.isAllowed(req.user.role, req.pathname, req.method);
            if(isAllowed) {
                return next();
            } else {
                err = new Error('User is not authorized');
                err.status = 403;
            }
        } else {
            err = new Error('User must authenticate');
            err.status = 401;
        }
        return next(err);
    }
};

/**
 * Add a new rule, starting with the resource to match
 * @param resource
 * @param actions
 * @returns {{thenOnlyAllow: thenOnlyAllow}}
 */
Acl.prototype.match = function(resource, actions) {

    var self = this;

    //TODO: find same rules and update if already defined
    return {
        thenOnlyAllow: function(roles) {
            self.rules.push({
                roles: roles,
                resourcePattern: resource,
                actions: actions
            });
        }
    }
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

    //test rules in reverse order. last defined have highest priority
    var rule, i;
    for(i = this.rules.length - 1; i >= 0; i--) {
        rule = this.rules[i];

        //test if regex, or, otherwise, startsWith
        var matchResource = rule.resourcePattern instanceof RegExp ?
            rule.resourcePattern.test(resource) : resource.indexOf(rule.resourcePattern) === 0;

        //string star will match any otherwise find match in actions array
        var matchAction = rule.actions === '*' || rule.actions.indexOf(action) > -1;

        //if the resource + action is match then allow or deny, given the role
        if(matchResource && matchAction) {
            return rule.roles === '*' || rule.roles.indexOf(role) > -1;
        }
    }

    //deny by default
    return false;
};

Acl.prototype.serialize = function() {

    //temp patch regex tojson method
    var orignalRegexToJson = RegExp.prototype.toJSON;
    RegExp.prototype.toJSON = RegExp.prototype.toString;

    var serialized = JSON.stringify(this.rules);
    RegExp.prototype.toJSON = orignalRegexToJson;
    return serialized;
};

Acl.prototype.deserialize = function(rules) {

    if(typeof rules === 'string') {
        rules = JSON.parse(rules);
    }

    var isRegexPattern = new RegExp('^\/(.*)\/$');
    rules.forEach(function(rule) {
        if(typeof rule.resourcePattern === 'string') {
            var isRegex = isRegexPattern.exec(rule.resourcePattern);
            if(isRegex) {
                rule.resourcePattern = isRegex[1];
            }
        }
    });

    this.rules = rules;
};