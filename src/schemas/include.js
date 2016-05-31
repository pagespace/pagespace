'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

function generateSchema() {

    const includeSchema = Schema({
        data: {
            type: Schema.Types.Mixed
        },
        createdAt: {
            type: Date,
            default: Date.now()
        },
        updatedAt: {
            type: Date
        },
        draft: {
            type: Boolean,
            default: true
        }
    });

    includeSchema.pre('save', function (next) {
        this.updatedAt = Date.now();
        next();
    });

    includeSchema.pre('findOneAndUpdate', function (next) {
        this.getUpdate().updatedAt = Date.now();
        next();
    });

    return includeSchema;
}

module.exports = generateSchema;