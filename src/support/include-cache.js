var Promise = require('bluebird');
var Cacheman = require('cacheman');

var cache = null;

module.exports = {

    init: function(opts) {
        opts = opts || {};
        cache = new IncludeCache(opts);
    },
    getCache: function () {
        return cache;
    }
};

var IncludeCache = function(opts) {
    opts = opts || {};
    this.cache = new Cacheman('includes', opts);
};

IncludeCache.prototype.get = function(key) {
    var self = this;
    return new Promise(function(resolve, reject) {
        self.cache.get(key, function(err, val) {
            if(err) {
                reject(err);
            } else {
                resolve(val);
            }
        });
    });
};

IncludeCache.prototype.set = function(key, val, ttl) {
    var self = this;
    return new Promise(function(resolve, reject) {
        self.cache.set(key, val, ttl, function(err, val) {
            if(err) {
                reject(err);
            } else {
                resolve(val);
            }
        });
    });
};

IncludeCache.prototype.del = function(key) {
    var self = this;
    return new Promise(function(resolve, reject) {
        self.cache.del(key, function(err, val) {
            if(err) {
                reject(err);
            } else {
                resolve(val);
            }
        });
    });
};

IncludeCache.prototype.clear = function() {
    var self = this;
    return new Promise(function(resolve, reject) {
        self.cache.clear(function(err, val) {
            if(err) {
                reject(err);
            } else {
                resolve(val);
            }
        });
    });
};