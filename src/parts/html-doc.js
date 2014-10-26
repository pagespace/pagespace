"use strict";

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
	read: function(data) {
        return new Promise(function(resolve) {
            resolve(data);
        });
	},
    update: function(callback, data) {
        return {
            content: data
        };
    },
    delete: function(callback, data) {
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