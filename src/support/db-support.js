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

const toCollectionName = require('mongoose/lib/utils').toCollectionName;

const siteSchema = require('../schemas/site'),
    pageSchema = require('../schemas/page'),
    pluginSchema = require('../schemas/plugin'),
    includeSchema = require('../schemas/include'),
    templateSchema = require('../schemas/template'),
    userSchema = require('../schemas/user'),
    mediaSchema = require('../schemas/media'),
    hitSchema = require('../schemas/hit');

const modelData = [{
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
    name: 'Plugin',
    schema: pluginSchema,
    publishable: false
}, {
    name: 'Include',
    schema: includeSchema,
    publishable: true
}, {
    name: 'User',
    schema: userSchema,
    publishable: false
}, {
    name: 'Media',
    schema: mediaSchema,
    publishable: false
}, {
    name: 'Hit',
    schema: hitSchema,
    publishable: false
}];

class DbSupport {

    constructor(opts) {
        this.mongoose = opts.mongoose;
        this.cache = {};

        this.logger =  opts.logger;
    }

    initModels() {

        const logger = this.logger;
        const mongoose = this.mongoose;

        const liveModifier = '_live';

        modelData.forEach((modelDatum) => {
            const name = modelDatum.name;
            const schema = modelDatum.schema();
            const collectionName = toCollectionName(name);
            this.cache[name] = mongoose.model(name, schema, collectionName);
            logger.debug('Mongoose model with name [%s] and collection [%s] created', name, collectionName);
            if(modelDatum.publishable) {
                const liveName = name + liveModifier;
                const liveCollectionName = collectionName + liveModifier;
                const liveSchema = modelDatum.schema(liveModifier);
                this.cache[liveName] = mongoose.model(liveName, liveSchema, liveCollectionName);
                logger.debug('Mongoose model with name [%s] and collection [%s] created', liveName, liveCollectionName);
            }
        });
    }

    getModel(name, modifier) {

        const modelName = name + (modifier ? '_' + modifier : '');
        const model = this.cache[modelName];

        if(!model) {
            throw new Error('No schema is associated with the model with name ' + name + ' [' + modelName + ']');
        }

        return model;
    }
}

module.exports = function(opts) {
    return new DbSupport(opts);
};