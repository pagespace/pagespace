var Path = require('../src/models/url');
var Page = require('../src/models/page');
var Template = require('../src/models/template');
var PageModule = require('../src/models/part');

var mongoose = require('mongoose');
	
mongoose.connect('mongodb://localhost/test');
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function callback () {
	console.log("db connection established");

	var query = Path.findOne({ 
		url: "/my-page" 
	});
    query.populate("page")
	query.exec(function(err, result) {
		if(err) {
			console.log("Error:");
			console.log(err);
			
		} else {
			Page.populate(result.page, {
			 	path: 'regions.module template',
			}, function(err, result) {
			  	result.regions.forEach(function(result) {
			  		console.log(result)
			  	})
			  	process.exit(0);
			});
		}
	});
});