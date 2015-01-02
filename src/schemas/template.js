'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

function generateSchema() {
    var templateSchema = Schema({
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

    templateSchema.pre('save', function (next) {
        this.updatedAt = Date.now();
        next();
    });

    return templateSchema;
}

module.exports = generateSchema;