"use strict";

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

function generateSchema() {
    return Schema({
        name: {
            type: String,
            required: true
        },
        src: {
            type: String,
            unique: true,
            required: true
        },
        regions: [ String ],
        regionData: [ Schema.Types.Mixed ],
        properties: [{
            name: String,
            value: String
        }]
    });
}

module.exports = generateSchema;