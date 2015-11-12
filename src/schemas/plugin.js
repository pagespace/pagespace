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
    var pluginSchema = Schema({
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
        this.update({},{ $set: { updatedAt:  Date.now() }});
        next();
    });

    pluginSchema.virtual('config').get(function () {
        var plugin = getPluginModule(this.module);
        var config;
        if(plugin.__config && plugin.__config.pagespace) {
            config = plugin.__config.pagespace.config;
        }

        return config || {};
    });

    pluginSchema.virtual('name').get(function () {
        var plugin = getPluginModule(this.module);
        var name;
        if(plugin.__config && plugin.__config.pagespace) {
            name = plugin.__config.pagespace.name;
        } else if(plugin.__config) {
            name = plugin.__config.name;
        }

        return name || 'Unresolved plugin';
    });

    pluginSchema.set('toJSON', {
        virtuals: true
    });

    function getPluginModule(pluginModule) {
        var pluginResolver = require('../support/plugin-resolver')();
        return pluginResolver.require(pluginModule) || {};
    }

    return pluginSchema;
}

module.exports = generateSchema;