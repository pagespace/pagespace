'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

function generateSchema() {
    var partSchema = Schema({
        name: {
            type: String,
            required: true
        },
        module: {
            type: String,
            unique: true,
            required: true
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

    partSchema.pre('save', function (next) {
        this.updatedAt = Date.now();
        next();
    });

    return partSchema;
}

module.exports = generateSchema;