'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

function generateSchema() {

    const siteSchema = Schema({
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

    siteSchema.pre('findOneAndUpdate', function (next) {
        this.getUpdate().updatedAt = Date.now();
        next();
    });

    return siteSchema;
}


module.exports = generateSchema;