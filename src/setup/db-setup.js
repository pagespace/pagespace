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

var path = require('path'),
    fs = require('fs'),
    Promise = require('bluebird');

/**
 *
 * @param opts
 * @constructor
 */
var DataSetup = function(opts) {
    this.logger = opts.logger;
    this.dbSupport = opts.dbSupport;
    this.userBasePath = opts.userBasePath;
};

module.exports = function(opts) {
    return new DataSetup(opts);
};

/**
 * Data setup
 */
DataSetup.prototype.runSetup = function() {

    var self = this;
    var logger = this.logger;

    //once everything is ready
    var loadingPromises = Promise.join(self._loadPluginModules(), self._loadAdminUser(), self._loadSite());
    return loadingPromises.spread(function(plugins, users, site) {

        var promises = [];

        var pluginModules = plugins.map(function (plugin) {
            return plugin.module;
        });
        promises.push(pluginModules);

        //setup the site model for first run
        if (!site) {
            logger.info('Creating first site');
            var Site = self.dbSupport.getModel('Site');
            var newSite = new Site({
                name: 'New Pagespace site'
            });
            var saveNewSite = Promise.promisify(newSite.save, { context: newSite });
            var saveSitePromise = saveNewSite();
            promises.push(saveSitePromise);
            saveSitePromise.then(function () {
                logger.info('New site created successfully');
            });
        } else {
            promises.push(site);
        }

        //set up the default admin user for first run
        if (users.length === 0) {
            logger.warn('Creating admin user with default admin password');
            var User = self.dbSupport.getModel('User');
            var defaultAdmin = new User({
                username: 'admin',
                password: 'admin',
                role: 'admin',
                name: 'Administrator',
                updatePassword: true
            });
            var saveAdminUser = Promise.promisify(defaultAdmin.save, { context: defaultAdmin });
            var saveAdminUserPromise = saveAdminUser();
            promises.push(saveAdminUser());
            saveAdminUserPromise.then(function () {
                logger.info('Default admin user created');
            });
        } else {
            promises.push(users[0]);
        }
        return promises;
    });
};


/**
 * Preloads the plugins modules
 * @returns {*}
 */
DataSetup.prototype._loadPluginModules = function() {

    var logger = this.logger;

    var PluginModel = this.dbSupport.getModel('Plugin');
    var query = PluginModel.find({});
    var getPlugins = Promise.promisify(query.exec, { context: query });

    return Promise.join(this._findPluginModules(), getPlugins()).spread(function(newPluginsNames, dbPlugins) {

        var dbPluginNames = dbPlugins.map(function(dbPlugin) {
            return dbPlugin.module;
        });

        var toInstall = newPluginsNames.filter(function(newPlugin) {
            return dbPluginNames.indexOf(newPlugin) < 0;
        });

        if(toInstall.length > 0) {
            logger.info('Found %s new plugin(s) to import (%s)', toInstall.length, toInstall.join(', '));
        }

        var pluginModels = toInstall.map(function(pluginName) {
            return {
                module: pluginName
            };
        });
        var createPlugins = Promise.promisify(PluginModel.create, { context: PluginModel });
        return createPlugins(pluginModels);
    }).then(function() {
        return getPlugins();
    });
};

/**
 * Gets the admin users (if exists)
 * @returns {*}
 */
DataSetup.prototype._loadAdminUser = function() {

    //create an admin user on first run
    var User = this.dbSupport.getModel('User');
    var query = User.find({ role: 'admin'}, 'username');
    var getAdminUser = Promise.promisify(query.exec, { context: query });
    return getAdminUser();
};

/**
 * Gets the site (if exists)
 * @returns {*}
 */
DataSetup.prototype._loadSite = function() {

    var Site = this.dbSupport.getModel('Site');
    return Site.findOne().exec();
};

/**
 * Finds all the locally installed modules which are pagespace plugins and adds them to the `plugins` collection
 * @private
 */
DataSetup.prototype._findPluginModules = function() {

    var logger = this.logger;
    var localModulesDir = path.join(this.userBasePath, 'node_modules');

    return fs.readdirSync(localModulesDir).reduce(function(pluginModules, file) {
        try {
            var modulePath = path.join(localModulesDir, file, 'package.json');
            var module = require(modulePath);
            if(module.keywords && module.keywords.indexOf('pagespace-plugin') > -1) {
                logger.debug('Found installed plugin module [%s]', module.name);
                pluginModules.push(module.name);
            }
        } catch(err) {
            if(err.code !== 'MODULE_NOT_FOUND') {
                throw err;
            }
        }
        return pluginModules;
    }, []);
};