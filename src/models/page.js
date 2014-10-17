"use strict";

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

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
    	ref: 'Page' 
    },
   	regions: [{
   		region: String,
   		partInstance: {
   			type: Schema.Types.ObjectId,
   			ref: 'PartInstance'
   		}
   	}],
   	template: {
   		type: Schema.Types.ObjectId,
   		ref: 'Template'
   	},
    url: {
        type: String,
        unique: true
    }
});

var Page = mongoose.model('Page', pageSchema);

module.exports = Page;