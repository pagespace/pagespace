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

function generateSchema() {

    const includeSchema = Schema({
        data: {
            type: Schema.Types.Mixed
        },
        createdAt: {
            type: Date,
            default: Date.now()
        },
        updatedAt: {
            type: Date
        },
        draft: {
            type: Boolean,
            default: true
        }
    });

    includeSchema.pre('save', function (next) {
        this.updatedAt = Date.now();
        next();
    });

    includeSchema.pre('findOneAndUpdate', function (next) {
        this.getUpdate().updatedAt = Date.now();
        next();
    });

    return includeSchema;
}

module.exports = generateSchema;