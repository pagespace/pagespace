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