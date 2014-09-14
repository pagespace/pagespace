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
   		module: {
   			type: Schema.Types.ObjectId,
   			ref: 'Part'
   		}
   	}],
   	template: {
   		type: Schema.Types.ObjectId,
   		ref: 'Template'
   	},
    url: {
        type: Schema.Types.ObjectId,
        ref: 'Page'
    },
    state: {
        type: Number,
        default: 0
    }
});

var Page = mongoose.model('Page', pageSchema);

module.exports = Page;