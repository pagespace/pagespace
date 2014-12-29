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
 * along with Foobar.  If not, see <http://www.gnu.org/licenses/>.
 */

'use strict';

var fs = require('fs');
var path = require('path');

var PartResolver = function(opts) {

    this.logger = opts.logger.child({module: 'part-resolver'});
    this.basePath = opts.basePath;
    this.cache = {};
};

module.exports = function(opts) {
    return new PartResolver(opts);
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
        logger.info('Loading part module from %s...', partModulePath);

        try {
            partModule = require(partModulePath);

            //resolve part view
            //part views are also loaded from the same directory as the part module, using naming convention 'view.hbs'
            var partViewDir = path.extname(partModulePath) ? path.dirname(partModulePath) : partModulePath;
            var partViewPath = path.join(partViewDir, 'view.hbs');

            //load the part view
            logger.debug('Loading part view partial from %s...', partViewPath);
            var view = fs.readFileSync(partViewPath, 'utf8');
            partModule.init(view);
            this.cache[partModuleId] = partModule;
        } catch(e) {
            logger.error(e, 'A part module could not be resolved');
        }
    }
    return partModule;
};

PartResolver.prototype.get = function(partModuleId) {
    return this.cache[partModuleId] || null;
};

PartResolver.prototype._resolveModulePath = function(modulePath) {

    //resolve relative module paths to the app calling this middlware module
    if(modulePath.indexOf('./') === 0 || modulePath.indexOf('../') === 0) {
        var loadFrom = path.dirname(this.basePath);
        return path.join(loadFrom, modulePath);
    } else {
        return modulePath;
    }
};