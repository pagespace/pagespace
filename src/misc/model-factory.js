var mongoose = require('mongoose');
var toCollectionName = require('mongoose/lib/utils').toCollectionName;

var bunyan = require('bunyan');
var logger =  bunyan.createLogger({ name: 'model-factory' });
logger.level(GLOBAL.logLevel);

var ModelFactory = function() {

    this.cache = {};
};

module.exports = function() {
    return new ModelFactory();
};

ModelFactory.prototype.getModel = function(name, schema, collectionSuffix) {

    collectionSuffix = collectionSuffix ? '_' + collectionSuffix : '';
    var collectionName = name + collectionSuffix;
    var model = this.cache[collectionName];
    if(!model) {
        logger.debug('New mongoose model created for ' + name + (collectionSuffix ? ' (' + collectionSuffix + ')' : ''));
        model = this.createModel(name, schema, collectionSuffix);
        this.cache[collectionName] = model;
    }

    return model;
};

ModelFactory.prototype.createModel = function(name, schema, collectionSuffix) {

    return mongoose.model(name, schema, toCollectionName(name) + collectionSuffix);
};

