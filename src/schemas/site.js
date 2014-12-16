"use strict";

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

function generateSchema() {

    return Schema({
        _id: String,
        name: {
            type: String,
            required: true
        },
        analytics: {
            type: Schema.Types.ObjectId,
            ref: 'Site'
        }
    });
}

module.exports = generateSchema;