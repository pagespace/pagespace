"use strict";

var fs = require("fs");
var BluebirdPromise = require("bluebird");

module.exports = {
    userView: null,
	init: function() {
        var self = this;
        return new BluebirdPromise(function (resolve, reject) {
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
	read: function(data) {
        return {
            content: data
        };
	},
    getName: function() {
		return "HTML Test";
	},
    getView: function() {
        return this.userView;
    }
};