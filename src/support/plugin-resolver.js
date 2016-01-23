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
    resolve = require('resolve'),
    semver = require('semver'),
    psUtil = require('./pagespace-util'),
    pluginCache = require('./plugin-cache'),
    appConsts = require('../app-constants');

var instance = null;

var PluginResolver = function(opts) {

    this.logger = opts.logger;
    this.dbSupport = opts.dbSupport;
    this.userBasePath = opts.userBasePath;
    this.requireCache = {};
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
    var pluginModule = this.requireCache[pluginModuleId];
    if(!pluginModule) {
        try {
            var pluginPath = resolve.sync(pluginModuleId, {
                basedir: this.userBasePath
            });

            var pluginDirPath = path.dirname(pluginPath);

            var pluginConfig = this._getPluginConfig(pluginDirPath);

            var code = fs.readFileSync(pluginPath, 'utf8');
            var sandbox = {
                console : console,
                module  : {},
                __filename: pluginPath,
                __dirname: pluginDirPath,
                Buffer: Buffer,
                setTimeout: setTimeout,
                setInterval: setInterval,
                Promise: require('bluebird'),
                require : function(modulePath) {
                    var resolvedPath = resolve.sync(modulePath, {
                        basedir: pluginDirPath
                    });

                    try {
                        return require(resolvedPath);
                    } catch(err){
                        logger.error(err, 'Module unable to use require');
                    }
                },
                pagespace: {
                    getModel: function(name, previewMode) {
                        return self.dbSupport.getModel(name, previewMode ? '' : 'live');
                    },
                    getPageModel: function(previewMode) {
                        return self.dbSupport.getModel('Page', previewMode ? '' : 'live');
                    },
                    pluginResolver: self,
                    cache: pluginCache.getCache(pluginModuleId, pluginConfig.ttl),
                    logger: logger.child({plugin: pluginModuleId}),
                    userBasePath: this.userBasePath
                }
            };
            var ctxOpts = semver.lt('0.12.0', process.versions.node) ?
                // < 0.12 API
                pluginPath :
                // > 0.11 API
                {
                    filename: pluginPath
                };
                vm.runInNewContext(code, sandbox, ctxOpts);

            pluginModule = sandbox.module.exports;
            psUtil.assign(pluginModule, pluginConfig);
            this.requireCache[pluginModuleId] = pluginModule;
        } catch(err) {
            console.log(err);
            logger.warn(err, 'The plugin module %s could not be resolved', pluginModuleId);
        }
    }
    return pluginModule;
};

PluginResolver.prototype._getPluginConfig = function(pluginDirPath) {

    var pluginConf = {};

    var logger = this.logger;

    pluginConf.__dir = pluginDirPath;

    var pluginConfigPath = path.join(pluginDirPath, 'package.json');
    try {
        var packageConf = require(pluginConfigPath);
        pluginConf.name = packageConf.name;
        pluginConf.description = packageConf.description;
        pluginConf.config =  packageConf.pagespace || {};
        pluginConf.config.ttl = pluginConf.config.ttl || appConsts.DEFAULT_PLUGIN_CACHE_TTL;
    } catch(err) {
        logger.warn('Couldn\'t load plugin config at %s', pluginDirPath);
    }

    //load the plugin view
    var pluginViewPath = path.join(pluginDirPath, 'index.hbs');
    logger.debug('Loading plugin view partial from %s...', pluginViewPath);
    try {
        pluginConf.viewPartial = fs.readFileSync(pluginViewPath, 'utf8');
    } catch(err) {
        logger.warn('Cannot find an index template (index.hbs) for the plugin module for [%s]', pluginDirPath);
    }

    return pluginConf;
};