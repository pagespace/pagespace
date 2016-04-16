/**
 * Copyright © 2016, Versatile Internet
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
    const templateSchema = Schema({
        name: {
            type: String,
            required: true,
            unique: true
        },
        src: {
            type: String,
            required: true
        },
        regions: [{
            name: {
                type: String,
                required: true
            },
            sharing: {
                type: String,
                default: ''
            }
        }],
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

    templateSchema.pre('findOneAndUpdate', function (next) {
        this.getUpdate().updatedAt = Date.now();
        next();
    });

    return templateSchema;
}

module.exports = generateSchema;