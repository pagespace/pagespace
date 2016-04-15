/**
 * Copyright © 2016, Versatile Internet
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

const path = require('path'),
    fs = require('fs'),
    Promise = require('bluebird');

/**
 *
 * @param opts
 * @constructor
 */
class DataSetup {
 
    constructor(opts) {
        this.logger = opts.logger;
        this.dbSupport = opts.dbSupport;
        this.userBasePath = opts.userBasePath;
    }

    /**
     * Data setup
     */
    runSetup() {
        const logger = this.logger;
    
        //once everything is ready
        const loadingPromises = Promise.join(this._loadPluginModules(), this._loadAdminUser(), this._loadSite());
        return loadingPromises.spread((plugins, users, site) => {
    
            const promises = [];
    
            const pluginModules = plugins.map((plugin) => plugin.module);
            promises.push(pluginModules);
    
            //setup the site model for first run
            if (!site) {
                logger.info('Creating first site');
                const Site = this.dbSupport.getModel('Site');
                const newSite = new Site({
                    name: 'New Pagespace site'
                });
                const saveNewSite = Promise.promisify(newSite.save, { context: newSite });
                const saveSitePromise = saveNewSite();
                promises.push(saveSitePromise);
                saveSitePromise.then( () => {
                    logger.info('New site created successfully');
                });
            } else {
                promises.push(site);
            }
    
            //set up the default admin user for first run
            if (users.length === 0) {
                logger.warn('Creating admin user with default admin password');
                const User = this.dbSupport.getModel('User');
                const defaultAdmin = new User({
                    username: 'admin',
                    password: 'admin',
                    role: 'admin',
                    name: 'Administrator',
                    updatePassword: true
                });
                const saveAdminUser = Promise.promisify(defaultAdmin.save, { context: defaultAdmin });
                const saveAdminUserPromise = saveAdminUser();
                promises.push(saveAdminUser());
                saveAdminUserPromise.then( () => {
                    logger.info('Default admin user created');
                });
            } else {
                promises.push(users[0]);
            }
            return promises;
        });
    }
    
    /**
     * Preloads the plugins modules
     * @returns {*}
     */
    _loadPluginModules() {
        const logger = this.logger;
    
        const PluginModel = this.dbSupport.getModel('Plugin');
        const query = PluginModel.find({});
        const getPlugins = Promise.promisify(query.exec, { context: query });
    
        return Promise.join(this._findPluginModules(), getPlugins()).spread(function(newPluginsNames, dbPlugins) {
    
            const dbPluginNames = dbPlugins.map(function(dbPlugin) {
                return dbPlugin.module;
            });
    
            const toInstall = newPluginsNames.filter(function(newPlugin) {
                return dbPluginNames.indexOf(newPlugin) < 0;
            });
    
            if(toInstall.length > 0) {
                logger.info('Found %s new plugin(s) to import (%s)', toInstall.length, toInstall.join(', '));
            }
    
            const pluginModels = toInstall.map(function(pluginName) {
                return {
                    module: pluginName
                };
            });
            const createPlugins = Promise.promisify(PluginModel.create, { context: PluginModel });
            return createPlugins(pluginModels);
        }).then(function() {
            return getPlugins();
        });
    }

    /**
     * Gets the admin users (if exists)
     * @returns {*}
     */
    _loadAdminUser() {
        //create an admin user on first run
        const User = this.dbSupport.getModel('User');
        const query = User.find({ role: 'admin'}, 'username');
        const getAdminUser = Promise.promisify(query.exec, { context: query });
        return getAdminUser();
    }

    /**
     * Gets the site (if exists)
     * @returns {*}
     */
    _loadSite() {
        const Site = this.dbSupport.getModel('Site');
        return Site.findOne().exec();
    }

    /**
     * Finds all the locally installed modules which are pagespace plugins and adds them to the `plugins` collection
     * @private
     */
    _findPluginModules() {

        const logger = this.logger;
        const localModulesDir = path.join(this.userBasePath, 'node_modules');
    
        return fs.readdirSync(localModulesDir).reduce(function(pluginModules, file) {
            try {
                const modulePath = path.join(localModulesDir, file, 'package.json');
                const module = require(modulePath);
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
    }
}

module.exports = function(opts) {
    return new DataSetup(opts);
};

