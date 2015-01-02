'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

function generateSchema() {

    var siteSchema =  Schema({
        _id: String,
        name: {
            type: String,
            required: true
        },
        description: {
            type: String
        },
        analytics: {
            type: String
        },
        createdAt: {
            type: Date,
            default: Date.now()
        },
        updatedAt: {
            type: Date
        },
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: 'User'
        },
        updatedBy: {
            type: Schema.Types.ObjectId,
            ref: 'User'
        }
    });

    siteSchema.pre('save', function (next) {
        this.updatedAt = Date.now();
        next();
    });

    return siteSchema;
}


module.exports = generateSchema;