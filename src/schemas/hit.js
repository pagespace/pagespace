/**
 * Copyright © 2015, Versatile Internet
 *
 * This file is part of Pagespace.
 *
 * Pagespace is free software: you can redistribute it and/or modify
 * it under the terms of the Lesser GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Pagespace is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * Lesser GNU General Public License for more details.

 * You should have received a copy of the Lesser GNU General Public License
 * along with Pagespace.  If not, see <http://www.gnu.org/licenses/>.
 */

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