var Promise = require('bluebird');
var Cacheman = require('cacheman');

var cache = null;

module.exports = {
    getCache: function (opts) {
        opts = opts || {};

        if(!cache) {
            cache = new IncludeCache(opts.ttl);
        }

        return cache;
    }
};

var IncludeCache = function(ttl) {
    this.cache = new Cacheman('includes', {
        ttl: ttl
    });
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

IncludeCache.prototype.set = function(key, val) {
    var self = this;
    return new Promise(function(resolve, reject) {
        self.cache.set(key, val, function(err, val) {
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