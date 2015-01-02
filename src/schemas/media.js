'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

function generateSchema() {

    var mediaSchema = Schema({
        path: {
            type: String,
            required: true
        },
        size: {
            type: Number,
            required: true
        },
        fileName: {
            type: String,
            unique: true,
            required: true
        },
        type: {
            type: String,
            required: true
        },
        name: {
            type: String,
            required: true
        },
        description: {
            type: String
        },
        tags: [{
            type: String
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

    mediaSchema.pre('save', function (next) {
        this.updatedAt = Date.now();
        next();
    });

    return mediaSchema;
}

module.exports = generateSchema;