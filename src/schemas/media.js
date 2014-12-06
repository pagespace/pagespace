"use strict";

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

function generateSchema() {

    return Schema({
        path: {
            type: String
        },
        size: {
            type: Number
        },
        fileName: {
            type: String,
            unique: true
        },
        type: {
            type: String
        },
        name: {
            type: String
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