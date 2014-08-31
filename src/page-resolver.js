var Promise = require("bluebird");

var Url = require('./models/url');
var Page = require('./models/page');

module.exports = function() {
	return new PageResolver();
};

function PageResolver() {

}

PageResolver.prototype.findPage = function(url) {

	return new Promise(function (resolve, reject) {
	    var query = Url.findOne({
			url: url 
		});
	    query.populate("page")
		query.exec(function(err, result) {
			if(err) {
				console.log(err);
				reject(err);
			} else {
				//console.log(res)
				Page.populate(result.page, {
					path: 'regions.module template'
				}, function(err, result) {
				  	if(err) {
				  		reject(err)
				  	} else {
				  		resolve(result);
				  	}				  	
				});								
			}
		});
	});		
};