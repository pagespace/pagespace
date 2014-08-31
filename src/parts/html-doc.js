var fs = require("fs");
var Promise = require("bluebird");

module.exports = {
    userView: null,
	init: function() {
        var self = this;
        return new Promise(function (resolve, reject) {
            fs.readFile(__dirname + "/html-doc.hbs", "utf-8", function(err, result) {
                if(err) {
                    reject(err);
                } else {
                    self.userView = result;
                    resolve(self);
                }
            });
        });
    },
	read: function(data, db) {
        return {
            content: data
        }
	},
    getType: function() {
		return "htmlDoc";
	}
};