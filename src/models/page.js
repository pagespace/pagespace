var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var pageSchema = Schema({
	root: Boolean,
    parent: { 
    	type: Schema.Types.ObjectId, 
    	ref: 'Page' 
    },
    children: [{
    	type: Schema.Types.ObjectId, 
    	ref: 'Page' 
    }],
   	regions: [{
   		region: String,
   		module: {
   			type: Schema.Types.ObjectId,
   			ref: 'Part',
   			required: true
   		}
   	}],
   	template: {
   		type: Schema.Types.ObjectId,
   		ref: 'Template',
   		required: true
   	}
});

var Page = mongoose.model('Page', pageSchema);

module.exports = Page;