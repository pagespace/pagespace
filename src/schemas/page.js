'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

function generateSchema(modifier) {

    modifier = modifier || '';

    return Schema({
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
        }
    });
}

module.exports = generateSchema;