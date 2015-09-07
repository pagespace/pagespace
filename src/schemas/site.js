/**
 * Copyright © 2015, Philip Mander
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

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

function generateSchema() {

    var siteSchema =  Schema({
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
        },
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

    siteSchema.pre('save', function (next) {
        this.updatedAt = Date.now();
        next();
    });

    siteSchema.pre('findOneAndUpdate', function (next) {
        this.update({},{ $set: { updatedAt:  Date.now() }});
        next();
    });

    return siteSchema;
}


module.exports = generateSchema;