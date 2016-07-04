'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

function generateSchema() {
    const templateSchema = Schema({
        name: {
            type: String,
            required: true,
            unique: true
        },
        src: {
            type: String,
            required: true
        },
        regions: [{
            name: {
                type: String,
                required: true
            },
            sharing: {
                type: Boolean,
                default: false
            }
        }],
        properties: [{
            name: String,
            value: String
        }],
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

    templateSchema.pre('save', function (next) {
        this.updatedAt = Date.now();
        next();
    });

    templateSchema.pre('findOneAndUpdate', function (next) {
        this.getUpdate().updatedAt = Date.now();
        next();
    });

    return templateSchema;
}

module.exports = generateSchema;