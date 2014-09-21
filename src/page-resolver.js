var Promise = require("bluebird");

var Page = require('./models/page');

module.exports = function() {
	return new PageResolver();
};

function PageResolver() {

}

PageResolver.prototype.findPage = function(url) {

	return new Promise(function (resolve, reject) {
	    var query = Page.findOne({
			url: url 
		});
	    query.populate("redirect template");
		query.exec(function(err, result) {
			if(err) {
				console.log(err);
				reject(err);
			} else {

				resolve(result);
			}
		});
	});		
};