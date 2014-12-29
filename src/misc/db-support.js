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

var mongoose = require('mongoose');
var toCollectionName = require('mongoose/lib/utils').toCollectionName;

var siteSchema = require('../schemas/site');
var pageSchema = require('../schemas/page');
var partSchema = require('../schemas/part');
var templateSchema = require('../schemas/template');
var userSchema = require('../schemas/user');
var mediaSchema = require('../schemas/media');

var modelData = [{
    name: 'Site',
    schema: siteSchema,
    publishable: false
}, {
    name: 'Page',
    schema: pageSchema,
    publishable: true
}, {
    name: 'Template',
    schema: templateSchema,
    publishable: true
}, {
    name: 'Part',
    schema: partSchema,
    publishable: false
}, {
    name: 'User',
    schema: userSchema,
    publishable: false
}, {
    name: 'Media',
    schema: mediaSchema,
    publishable: false
}];

var DbSupport = function(opts) {

    this.cache = {};

    this.logger =  opts.logger.child({module: 'db-support'});
};

module.exports = function(opts) {
    return new DbSupport(opts);
};

DbSupport.prototype.initModels = function() {

    var self = this;
    var logger = this.logger;
    
    var liveModifier = '_live';
    
    modelData.forEach(function(modelDatum) {
        var name = modelDatum.name;
        var schema = modelDatum.schema();
        var collectionName = toCollectionName(name);
        self.cache[name] = mongoose.model(name, schema, collectionName);
        logger.debug('Mongoose model with name [%s] and collection [%s] created', name, collectionName);
        if(modelDatum.publishable) {
            var liveName = name + liveModifier;
            var liveCollectionName = collectionName + liveModifier;
            var liveSchema = modelDatum.schema(liveModifier);
            self.cache[liveName] = mongoose.model(liveName, liveSchema, liveCollectionName);
            logger.debug('Mongoose model with name [%s] and collection [%s] created', liveName, liveCollectionName);
        }
    });
};

DbSupport.prototype.getModel = function(name, modifier) {

    var modelName = name + (modifier ? '_' + modifier : '');
    var model = this.cache[modelName];
    
    if(!model) {
        throw new Error('No schema is associated with the model with name ' + name + ' [' + modelName + ']');
    }

    return model;
};