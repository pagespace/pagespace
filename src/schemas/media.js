"use strict";

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

function generateSchema() {

    return Schema({
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
        }]
    });
}

module.exports = generateSchema;