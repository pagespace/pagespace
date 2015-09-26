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

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

function generateSchema() {

    var mediaSchema = Schema({
        path: {
            type: String,
            required: true
        },
        size: {
            type: Number,
            required: true
        },
        width: {
            type: Number,
            required: false
        },
        height: {
            type: Number,
            required: false
        },
        fileName: {
            type: String,
            unique: true,
            required: true
        },
        type: {
            type: String,
            required: true
        },
        name: {
            type: String,
            required: true
        },
        description: {
            type: String
        },
        tags: [{
            type: Schema.Types.Mixed
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

    mediaSchema.pre('save', function (next) {
        this.updatedAt = Date.now();
        next();
    });

    mediaSchema.pre('findOneAndUpdate', function (next) {
        this.update({},{ $set: { updatedAt:  Date.now() }});
        next();
    });

    mediaSchema.set('toJSON', {
        transform: function(doc, media) {
            delete media.path;
            return media;
        }
    });

    return mediaSchema;
}



module.exports = generateSchema;