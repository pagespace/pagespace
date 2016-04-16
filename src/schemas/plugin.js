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
    const pluginSchema = Schema({
        module: {
            type: String,
            unique: true,
            required: true
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

    pluginSchema.pre('save', function (next) {
        this.updatedAt = Date.now();
        next();
    });

    pluginSchema.pre('findOneAndUpdate', function (next) {
        this.getUpdate().updatedAt = Date.now();
        next();
    });

    pluginSchema.virtual('config').get(function () {
        const plugin = getPluginModule(this.module);
        return plugin.config || [];
    });

    pluginSchema.virtual('name').get(function () {
        const plugin = getPluginModule(this.module);
        return plugin.name;
    });

    pluginSchema.set('toJSON', {
        virtuals: true
    });

    function getPluginModule(pluginModule) {
        const pluginResolver = require('../support/plugin-resolver')();
        return pluginResolver.require(pluginModule) || {};
    }

    return pluginSchema;
}

module.exports = generateSchema;