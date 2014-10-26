"use strict";

var BluebirdPromise = require('bluebird');

var entityMap = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
    "/": "&#x2F;"
};

module.exports = {

    typeify: function typeify(value) {
        if(typeof value === 'undefined' || value === null) {
            return null;
        } else if(!isNaN(parseFloat(+value))) {
            return parseFloat(value);
        } else if(value.toLowerCase() === 'false') {
            return false;
        } else if(value.toLowerCase() === 'true') {
            return true;
        } else {
            return value;
        }
    },

    defer: function defer() {
        var resolve, reject;
        var promise = new BluebirdPromise(function() {
            resolve = arguments[0];
            reject = arguments[1];
        });
        return {
            resolve: resolve,
            reject: reject,
            promise: promise
        };
    },

    escapeHtml: function(value) {
        if(typeof value === "string") {
            return value.replace(/[&<>"'\/]/g, function (s) {
                return entityMap[s];
            });
        } else {
            return value;
        }
    }
};