"use strict";

var fs = require("fs");
var BluebirdPromise = require("bluebird");

module.exports = {
    userView: null,
	init: function() {
        var self = this;
        return new BluebirdPromise(function (resolve, reject) {
            fs.readFile(__dirname + "/web-copy.hbs", "utf-8", function(err, result) {
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
        if(!data) {
            data =  '<p>Web copy</p>';
        }
        return data;
	},
    update: function(originalData, update) {
        return update.data;
    },
    delete: function(callback, data) {
        return {
            content: data
        };
    },
    getName: function() {
		return "Web copy";
	},
    getView: function() {
        return this.userView;
    }
};