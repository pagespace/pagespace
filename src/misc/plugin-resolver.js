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
    path = require('path');

var instance = null;

var PluginResolver = function(opts) {

    this.logger = opts.logger;
    this.userBasePath = opts.userBasePath;
    this.cache = {};
    this.devMode = opts.devMode || false;
};

module.exports = function(opts) {

    if(!instance) {
        instance = new PluginResolver(opts);
    }

    return instance;
};

PluginResolver.prototype.require = function(pluginModuleId) {

    var logger = this.logger;

    if(!pluginModuleId) {
        return null;
    }
    var pluginModule = this.get(pluginModuleId);
    if(!pluginModule) {
        //resolve plugin module
        //this whole plugin is a bit convoluted. Assumes module paths starting with ./ or ../
        //should be resolved relative to the express app using this middleware.
        var pluginModulePath = this._resolveModulePath(pluginModuleId);

        try {
            pluginModule = require(pluginModulePath);

            this.initPluginModule(pluginModule, pluginModulePath);
            this.cache[pluginModuleId] = pluginModule;
        } catch(e) {
            logger.warn(e, 'A plugin module could not be resolved');
        }
    }
    return pluginModule;
};

PluginResolver.prototype.requireByName = function(pluginModuleName) {

    for(var moduleId in this.cache) {
        if(this.cache.hasOwnProperty(moduleId) && this.cache[moduleId].__config.name === pluginModuleName) {
            return this.require(moduleId);
        }
    }

    this.logger.warn('Cannot resolve module for module name [%s]', pluginModuleName);
    this.logger.warn('Modules loaded by name, must have been previously required by calling require');
    return null;
};

PluginResolver.prototype.get = function(pluginModuleId) {
    var module = this.cache[pluginModuleId] || null;

    if(module && this.devMode) {
        var pluginModulePath = this._resolveModulePath(pluginModuleId);
        this.initPluginModule(pluginModulePath, module);
    }

    return module;
};

PluginResolver.prototype.initPluginModule = function(pluginModule, pluginModulePath) {

    var logger = this.logger;

    var pluginConfigPath = path.join(pluginModulePath, 'package.json');
    try {
        pluginModule.__config = require(pluginConfigPath);
    } catch(err) {
        logger.warn('Couldn\'t load plugin config at %s', pluginModulePath);
    }

    pluginModule.__dir = pluginModulePath;

    //load the plugin view
    var pluginViewPath = path.join(pluginModulePath, 'index.hbs');
    logger.debug('Loading plugin view partial from %s...', pluginViewPath);
    try {
        pluginModule.__viewPartial = fs.readFileSync(pluginViewPath, 'utf8');
    } catch(err) {
        logger.warn('Cannot find an index template (index.hbs) for the plugin module for [%s]', pluginModulePath);
    }
};

PluginResolver.prototype._resolveModulePath = function(module) {

    //resolve relative module paths to the app calling this middlware module
    if(module.indexOf('./') === 0 || module.indexOf('../') === 0) {
        return path.resolve(this.userBasePath, module);
    } else {
        return path.dirname(require.resolve(module));
    }
};