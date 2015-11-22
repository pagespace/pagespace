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

var vm = require('vm'),
    fs = require('fs'),
    path = require('path'),
    resolve = require('resolve');

var instance = null;

var PluginResolver = function(opts) {

    this.logger = opts.logger;
    this.dbSupport = opts.dbSupport;
    this.userBasePath = opts.userBasePath;
    this.cache = {};
};

module.exports = function(opts) {

    if(!instance) {
        instance = new PluginResolver(opts);
    }

    return instance;
};

PluginResolver.prototype.require = function(pluginModuleId) {

    var self = this;
    var logger = this.logger;

    if(!pluginModuleId) {
        return null;
    }
    var pluginModule = this.cache[pluginModuleId];
    if(!pluginModule) {
        try {
            var pluginPath = resolve.sync(pluginModuleId, {
                basedir: this.userBasePath
            });
            var pluginDirPath = path.dirname(pluginPath);
            var code = fs.readFileSync(pluginPath, 'utf8');
            var sandbox = {
                console : console,
                module  : {},
                __filename: pluginPath,
                __dirname: pluginDirPath,
                require : function(modulePath) {
                    var resolvedPath = resolve.sync(modulePath, {
                        basedir: pluginDirPath
                    });

                    //TODO: this a quick workaround to require not being in the plugin module context.
                    //it may cause issues if the plugin module requires  a different version of a module already
                    //required by Pagespace
                    try {
                        return require(resolvedPath);
                    } catch(err){
                        logger.error(err, 'Module unable to use require');
                    }
                },
                pagespace: {
                    getPageModel: function(previewMode) {
                        return self.dbSupport.getModel('Page', previewMode ? '' : 'live');
                    },
                    pluginResolver: self,
                    logger: logger.child({plugin: pluginModuleId}),
                    userBasePath: this.userBasePath
                }
            };
            vm.runInNewContext(code, sandbox, __filename); //TODO: make filename an opts object in Node 4+
            pluginModule = sandbox.module.exports;

            this.initPluginModule(pluginModule, pluginDirPath);
            this.cache[pluginModuleId] = pluginModule;
        } catch(err) {
            logger.warn(err, 'The plugin module %s could not be resolved', pluginModuleId);
        }
    }
    return pluginModule;
};

PluginResolver.prototype.initPluginModule = function(pluginModule, pluginDirPath) {

    var logger = this.logger;

    pluginModule.__dir = pluginDirPath;

    var pluginConfigPath = path.join(pluginDirPath, 'package.json');
    try {
        pluginModule.__config = require(pluginConfigPath);
        pluginModule.__config.pagespace = pluginModule.__config.pagespace || {};
        pluginModule.__config.pagespace.name = pluginModule.__config.pagespace.name || pluginModule.__config.name;
    } catch(err) {
        logger.warn('Couldn\'t load plugin config at %s', pluginDirPath);
    }

    //load the plugin view
    var pluginViewPath = path.join(pluginDirPath, 'index.hbs');
    logger.debug('Loading plugin view partial from %s...', pluginViewPath);
    try {
        pluginModule.__viewPartial = fs.readFileSync(pluginViewPath, 'utf8');
    } catch(err) {
        logger.warn('Cannot find an index template (index.hbs) for the plugin module for [%s]', pluginDirPath);
    }
};