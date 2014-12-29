'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

function generateSchema() {

    return Schema({
        _id: String,
        name: {
            type: String,
            required: true
        },
        description: {
            type: String
        },
        analytics: {
            type: String
        }
    });
}

module.exports = generateSchema;