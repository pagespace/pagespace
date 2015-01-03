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

var fs = require('fs'),
    handlebars = require('handlebars');

//TODO: add debug logging
function ViewEngine() {
    this.cache = {};
    this.handlebarsInstances = {};
}

var instance = new ViewEngine();

module.exports = function() {
    return instance;
};

ViewEngine.prototype.getHandlebarsInstance = function(instanceId) {
    instanceId = instanceId || 'default';

    if(!this.handlebarsInstances[instanceId]) {
        this.handlebarsInstances[instanceId] = handlebars.create();
    }
    return this.handlebarsInstances[instanceId];
};

ViewEngine.prototype.__express = function(filename, locals, cb) {

    locals = locals || {};
    var cache = instance.cache;
    var handleBarsInstance = instance.getHandlebarsInstance(locals.__template);

    // cached?
    var template = cache[filename];
    if (template) {
        return cb(null, template(locals));
    }

    fs.readFile(filename, 'utf8', function(err, str){
        if (err) {
            return cb(err);
        }

        var template = handleBarsInstance.compile(str);
        if (locals.cache) {
            cache[filename] = template;
        }

        try {
            var res = template(locals);
            cb(null, res);
        } catch (err) {
            err.message = filename + ': ' + err.message;
            cb(err);
        }
    });
};

ViewEngine.prototype.registerHelper = function(name, helper, template) {
    this.getHandlebarsInstance(template).registerHelper(name, helper);
};

ViewEngine.prototype.registerPartial = function (name, partial, template) {
    this.getHandlebarsInstance(template).registerPartial(name, partial);
};

ViewEngine.prototype.unregisterHelper = function(name, template) {
    this.getHandlebarsInstance(template).unregisterHelper(name);
};

ViewEngine.prototype.unregisterPartial = function (name, template) {
    this.getHandlebarsInstance(template).unregisterPartial(name);
};