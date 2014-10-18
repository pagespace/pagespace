"use strict";

var BluebirdPromise = require("bluebird");
var Page = require('./../models/page');

function PageResolver() {
}

module.exports = function() {
    return new PageResolver();
};

PageResolver.prototype.findPage = function(url) {

	return new BluebirdPromise(function (resolve, reject) {
	    var query = Page.findOne({
			url: url 
		});
	    query.populate("redirect template regions.partInstance");
		query.exec(function(err, result) {
			if(err) {
				reject(err);
			} else {
				resolve(result);
			}
		});
	});		
};