var Url = require('../src/models/url');
var Page = require('../src/models/page');
var Template = require('../src/models/template');
var Part = require('../src/models/part');

var mongoose = require('mongoose');
	
mongoose.connect('mongodb://localhost/test');
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function callback () {
	console.log("db connection established")

	
	//53e9469b713ff6fd0d493a8a
    /*
	var template = new Template({
		src: "views/template-a.hbs",
		regions: [ "A", "B", "C"]
	});

	template.save(function(err, template) {
		if(err) {
			console.log(err);
		}
		console.log(template);
	});
*/
	/*

	//53e94967fe6676f60ee3a051
	/*var module = new PageModule({
		type: "htmlDoc",
		data: {}
	});
	module.save(function(err, module) {
		if(err) {
			console.log(err);
		}
		console.log(module);
	});*/

	/*
	//53e94ce5a47a70a50f6065c8,
	var page = new Page({
		regions: [{
			region: "A",
			module: "53e94967fe6676f60ee3a051"
		},{
			region: "B",
			module: "53e94967fe6676f60ee3a051"
		},{
			region: "C",
			module: "53e94967fe6676f60ee3a051"
		}],
		template: "53e9469b713ff6fd0d493a8a"
	});

	page.save(function(err, page) {
		if(err) {
			console.log(err);
		}
		console.log(page);
	});
	*/


	var url = new Url({
		url: "/my-page",
		page: "53e94ce5a47a70a50f6065c8"
	});

	url.save(function(err, url) {
		if(err) {
			console.log(err);
		}
		console.log(url);
	});






});