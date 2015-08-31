'use strict';
var Promise = require('bluebird');
var path = require('path');
var fs = require('fs');
var url = require('url');
var http = require('http')

var readFileAsync = Promise.promisify(fs.readFile)

var cache = {};

module.exports = {
    reset: function(key) {
        if(key) {
            delete cache[key];
        } else {
            cache = {};
        }
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
                return val;
            }).catch(function() {
                return '<!-- Unable to resolve html include -->';
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

            return new Promise(function(resolve, reject) {
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
            }).catch(function() {
                return '<!-- Unable to resolve html include -->';
            });
        } else if(data && data.html) {
            return data.html;
        }

        return '<!-- HTML Include (No data to include) -->';
    },
    defaultData: {
        html: '<p>I am an HTML include</p>'
    }
};