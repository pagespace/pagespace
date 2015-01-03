'use strict';
var BluebirdPromise = require('bluebird');
var path = require('path');
var fs = require('fs');
var url = require('url');
var http = require('http')

var readFileAsync = BluebirdPromise.promisify(fs.readFile)

var cache = {};

module.exports = {
    viewPartial: null,
    init: function(viewPartial) {
        this.viewPartial = viewPartial;
    },
    process: function(data, support) {

        //read from cache
        if(data && ((data.file && cache[data.file]) || (data.href && cache[data.href]))) {
            return cache[data.file] || cache[data.href];
        }

        //read from fs
        if(data && data.file) {
            var filePath = path.resolve(support.basePath, data.file);
            var promise = readFileAsync(filePath, 'utf8');
            promise.then(function(val) {
                cache[data.file] = val;
            });
            return promise;
        } else if(data && data.href) {
            var urlParts = url.parse(data.href);
            var requestOpts = {
                hostname: urlParts.hostname,
                port: urlParts.port,
                path: urlParts.path,
                method: 'GET'
            };

            return new BluebirdPromise(function(resolve, reject) {
                var req = http.request(requestOpts, function(res) {
                    var body = '';

                    res.on('data', function(chunk) {
                        body += chunk;
                    });

                    res.on('end', function() {
                        cache[data.href] = body;
                        resolve(body);
                    });
                });

                req.on('error', function(err) {
                    reject(err);
                });

                req.end();
            });
        }

        return 'No file specified';
    }
};