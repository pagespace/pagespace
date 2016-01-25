var Promise = require('bluebird');
var Cacheman = require('cacheman');

var pluginCaches = {};

module.exports = {
    getCache: function (pluginName, opts) {
        opts = opts || {};

        if(typeof pluginCaches[pluginName] === 'undefined') {
            pluginCaches[pluginName] = new PluginCache(pluginName, opts.ttl);
        }

        return pluginCaches[pluginName];
    }
};

var PluginCache = function(pluginName, ttl) {
    this.cache = new Cacheman(pluginName, {
        ttl: ttl
    });
};

PluginCache.prototype.get = function(key) {
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

PluginCache.prototype.set = function(key, val) {
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

PluginCache.prototype.del = function(key) {
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

PluginCache.prototype.clear = function() {
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