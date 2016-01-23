var Promise = require('bluebird');
var Cacheman = require('cacheman');

var cache = new Cacheman('plugins');

var pluginCaches = {};

module.exports = {
    getCache: function (pluginId, opts) {
        opts = opts || {};

        if(typeof pluginCaches[pluginId] === 'undefined') {
            pluginCaches[pluginId] = new PluginCache(pluginId, opts.ttl);
        }

        return pluginCaches[pluginId];
    }
};

var PluginCache = function(pluginId, ttl) {
    this.ttl = ttl;
    this.pluginId = pluginId;
};

PluginCache.prototype.get = function() {
    var self = this;
    return new Promise(function(resolve, reject) {
        cache.get(self.pluginId, function(err, val) {
            if(err) {
                reject(err);
            } else {
                resolve(val);
            }
        });
    });
};

PluginCache.prototype.set = function(val) {
    var self = this;
    return new Promise(function(resolve, reject) {
        cache.set(self.pluginId, val, self.ttl, function(err, val) {
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
        cache.del(self.pluginId, function(err, val) {
            if(err) {
                reject(err);
            } else {
                resolve(val);
            }
        });
    });
};
