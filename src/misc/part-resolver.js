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

var PartResolver = function(opts) {

    this.logger = opts.logger;
    this.userBasePath = opts.userBasePath;
    this.cache = {};
    this.devMode = opts.devMode || false;
};

module.exports = function(opts) {

    if(!instance) {
        instance = new PartResolver(opts);
    }

    return instance;
};

PartResolver.prototype.require = function(partModuleId) {

    var logger = this.logger;

    if(!partModuleId) {
        return null;
    }
    var partModule = this.get(partModuleId);
    if(!partModule) {
        //resolve part module
        //this whole part is a bit convoluted. Assumes module paths starting with ./ or ../
        //should be resolved relative to the express app using this middleware.
        var partModulePath = this._resolveModulePath(partModuleId);

        try {
            partModule = require(partModulePath);

            this.initPartModule(partModule, partModulePath);
            this.cache[partModuleId] = partModule;
        } catch(e) {
            logger.error(e, 'A part module could not be resolved');
        }
    }
    return partModule;
};

PartResolver.prototype.get = function(partModuleId) {
    var module = this.cache[partModuleId] || null;

    if(module && this.devMode) {
        var partModulePath = this._resolveModulePath(partModuleId);
        this.initPartModule(partModulePath, module);
    }

    return module;
};

PartResolver.prototype.initPartModule = function(partModule, partModulePath) {

    var logger = this.logger;

    var partConfigPath = path.join(partModulePath, 'package.json');
    try {
        partModule.__config = require(partConfigPath);
    } catch(err) {
        logger.warn('Couldn\'t load part config at %s', partModulePath)
    }

    partModule.__dir = partModulePath;

    //load the part view
    var partViewPath = path.join(partModulePath, 'index.hbs');
    logger.debug('Loading part view partial from %s...', partViewPath);
    try {
        partModule.__viewPartial = fs.readFileSync(partViewPath, 'utf8');
    } catch(err) {
        logger.warn('Cannot find an index template (index.hbs) for the  part module for [%s]', partModulePath);
    }
};

PartResolver.prototype._resolveModulePath = function(module) {

    //resolve relative module paths to the app calling this middlware module
    if(module.indexOf('./') === 0 || module.indexOf('../') === 0) {
        return path.resolve(this.userBasePath, module);
    } else {
        return path.dirname(require.resolve(module));
    }
};