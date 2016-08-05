'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

function generateSchema(modifier) {

    modifier = modifier || '';

    const pageSchema = Schema({
        root: {
            type: String
        },
        name: {
            type: String,
            required: true
        },
        parent: {
            type: Schema.Types.ObjectId,
            ref: 'Page' + modifier
        },
        regions: [{
            name: {
                type: String,
                required: true
            },
            includes: [{
                plugin: {
                    type: Schema.Types.ObjectId,
                    ref: 'Plugin'
                },
                include: {
                    type: Schema.Types.ObjectId,
                    ref: 'Include' + modifier
                }
            }]
        }],
        template: {
            type: Schema.Types.ObjectId,
            ref: 'Template' + modifier
        },
        basePage: {
            type: Schema.Types.ObjectId,
            ref: 'Page'
        },
        url: {
            type: String,
            unique: true,
            index: true
        },
        order: {
            type: Number,
            default: -1
        },
        useInNav: {
            type: Boolean,
            default: true
        },
        draft: {
            type: Boolean,
            default: true
        },
        published: {
            type: Boolean,
            default: false
        },
        redirect: {
            type: Schema.Types.ObjectId,
            ref: 'Page' + modifier
        },
        status: {
            type: Number,
            default: 200
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
        },
        expiresAt: {
            type: Date,
            default: null
        },
        publishedAt: {
            type: Date,
            default: () => {
                return this.createdAt;
            }
        },
        macro : {
            type: Schema.Types.ObjectId,
            ref: 'Macro'
        }
    });

    pageSchema.pre('save', function (next) {
        this.updatedAt = Date.now();
        next();
    });

    pageSchema.pre('findOneAndUpdate', function (next) {
        this.getUpdate().updatedAt = Date.now();
        next();
    });

    return pageSchema;
}

module.exports = generateSchema;