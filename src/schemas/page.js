'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

function generateSchema(modifier) {

    modifier = modifier || '';

    var pageSchema = Schema({
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
            data: Schema.Types.Mixed,
            part: {
                type: Schema.Types.ObjectId,
                ref: 'Part'
            }
        }],
        template: {
            type: Schema.Types.ObjectId,
            ref: 'Template' + modifier
        },
        url: {
            type: String,
            unique: true,
            index: true
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
            default: new Date(Date.now + 1000 * 60 * 60 * 24 * 365 * 50) //50 years default!
        }
    });

    pageSchema.pre('save', function (next) {
        this.updatedAt = Date.now();
        next();
    });

    return pageSchema;
}

module.exports = generateSchema;