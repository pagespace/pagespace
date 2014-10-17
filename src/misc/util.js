"use strict";

var Promise = require('bluebird');

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
        var promise = new Promise(function() {
            resolve = arguments[0];
            reject = arguments[1];
        });
        return {
            resolve: resolve,
            reject: reject,
            promise: promise
        };
    }
};