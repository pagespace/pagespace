'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

function generateSchema(modifier) {

    modifier = modifier || '';

    const macroSchema = Schema({
        name: {
            type: String,
            required: true
        },
        parent: {
            type: Schema.Types.ObjectId,
            ref: 'Page' + modifier,
            required: true
        },
        template: {
            type: Schema.Types.ObjectId,
            ref: 'Template' + modifier,
            required: true
        },
        basePage: {
            type: Schema.Types.ObjectId,
            ref: 'Page'
        },
        includes: [{
            name: {
                type: String
            },
            region: {
                type: String,
                required: true
            },
            plugin: {
                type: Schema.Types.ObjectId,
                ref: 'Plugin',
                required: true
            }
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

    macroSchema.pre('save', function (next) {
        this.updatedAt = Date.now();
        next();
    });

    macroSchema.pre('findOneAndUpdate', function (next) {
        this.getUpdate().updatedAt = Date.now();
        next();
    });

    return macroSchema;
}

module.exports = generateSchema;