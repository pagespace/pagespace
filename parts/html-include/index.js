'use strict';
var BluebirdPromise = require('bluebird');
var path = require('path');
var fs = require('fs');

var readFileAsync = BluebirdPromise.promisify(fs.readFile)

var cache = {};

module.exports = {
    viewPartial: null,
    init: function(viewPartial) {
        this.viewPartial = viewPartial;
    },
    process: function(data, support) {

        //read from cache
        if(data && data.file && cache[data.file]) {
            return cache[data.file];
        }

        //read from fs
        if(data && data.file) {
            var filePath = path.resolve(support.basePath, data.file);
            var promise = readFileAsync(filePath, 'utf8');
            promise.then(function(val) {
                cache[data.file] = val;
            });
            return promise;
        }

        return 'No file specified';
    }
};