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