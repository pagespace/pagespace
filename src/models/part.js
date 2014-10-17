"use strict";

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var partSchema = Schema({
    name: {
        type: String,
        unique: true,
        required: true
    },
    module: {
    	type: String,
    	unique: true,
    	required: true
    }
});

var PartModule = mongoose.model('Part', partSchema);

module.exports = PartModule;