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

function generateSchema(modifier) {

    modifier = modifier || '';

    var pageSchema = Schema({
        root: {
            type: String
        },
        name: {
            type: String,
            required: true
        },
        parent: {
            type: Schema.Types.ObjectId,
            ref: 'Page' + modifier
        },
        regions: [{
            name: {
                type: String,
                required: true
            },
            data: Schema.Types.Mixed,
            part: {
                type: Schema.Types.ObjectId,
                ref: 'Part'
            }
        }],
        template: {
            type: Schema.Types.ObjectId,
            ref: 'Template' + modifier
        },
        url: {
            type: String,
            unique: true,
            index: true
        },
        order: {
            type: Number,
            default: -1
        },
        useInNav: {
            type: Boolean,
            default: true
        },
        draft: {
            type: Boolean,
            default: true
        },
        published: {
            type: Boolean,
            default: false
        },
        redirect: {
            type: Schema.Types.ObjectId,
            ref: 'Page' + modifier
        },
        status: {
            type: Number,
            default: 200
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
        },
        expiresAt: {
            type: Date,
            default: null
        }
    });

    pageSchema.pre('save', function (next) {
        this.updatedAt = Date.now();
        next();
    });

    return pageSchema;
}

module.exports = generateSchema;