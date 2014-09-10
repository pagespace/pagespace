var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var urlSchema = mongoose.Schema({
    url: {
    	type: String,
    	required: true
    },
    page: { 
    	type: Schema.Types.ObjectId, 
    	ref: 'Page' 
    },
    redirect: {
    	url: String,
    	responseCode: Number
    }
});

var Url = mongoose.model('Url', urlSchema);

module.exports = Url;