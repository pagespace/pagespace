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

var Promise = require('bluebird'),
    consts = require('../app-constants');

/**
 *
 * @param opts
 * @constructor
 */
var DataSetup = function(opts) {
    this.logger = opts.logger;
    this.dbSupport = opts.dbSupport;
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

    var loadPluginModules = self._loadPluginModules();
    var loadAdminUser = self._loadAdminUser();
    var loadSite = self._loadSite();

    //once everything is ready
    return Promise.join(loadPluginModules, loadAdminUser, loadSite, function(plugins, users, site) {

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
                _id: consts.DEFAULT_SITE_ID,
                name: 'New Pagespace site'
            });
            var saveNewSite = Promise.promisify(newSite.save, newSite);
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
            var saveAdminUser = Promise.promisify(defaultAdmin.save, defaultAdmin);
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

    var Plugin = this.dbSupport.getModel('Plugin');
    var query = Plugin.find({});
    var getPlugins = Promise.promisify(query.exec, query);
    return getPlugins();
};

/**
 * Gets the admin users (if exists)
 * @returns {*}
 */
DataSetup.prototype._loadAdminUser = function() {

    //create an admin user on first run
    var User = this.dbSupport.getModel('User');
    var query = User.find({ role: 'admin'}, 'username');
    var getAdminUser = Promise.promisify(query.exec, query);
    return getAdminUser();
};

/**
 * Gets the site (if exists)
 * @returns {*}
 */
DataSetup.prototype._loadSite = function() {

    //create an admin user on first run
    var Site = this.dbSupport.getModel('Site');
    var query = Site.findById(consts.DEFAULT_SITE_ID);
    var getSite = Promise.promisify(query.exec, query);
    return getSite();
};
