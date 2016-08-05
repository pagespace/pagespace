'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

function generateSchema(modifier) {

    const hitSchema = Schema({
        page: {
            type: Schema.Types.ObjectId,
            ref: 'Page' + modifier
        },
        referrer: {
            type: String,
            required: false
        },
        ip: {
            type: String,
            required: false
        },
        agent: {
            type: String,
            required: false
        },
        session: {
            type: String,
            required: false
        },
        time: {
            type: Date,
            default: Date.now()
        }
    }, {
        capped: {
            size: 14000000,
            max: 50000
        }
    });

    hitSchema.pre('save', function (next) {
        this.time = Date.now();
        next();
    });

    return hitSchema;
}

module.exports = generateSchema;