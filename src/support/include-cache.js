'use strict';

//de[s
const
    Cacheman = require('cacheman');

let cache = null;

module.exports = {
    init: function(opts) {
        opts = opts || {};
        cache = new IncludeCache(opts);
    },
    getCache: function () {
        return cache;
    }
};

class IncludeCache {
    
    constructor(opts) {
        opts = opts || {};
        this.cache = new Cacheman('includes', opts);      
    }

    get(key) {
        return this.cache.get(key);
    }

    set(key, val, ttl) {
        return this.cache.set(key, val, ttl);
    }

    del(key) {
        return this.cache.del(key);
    }

    clear() {
        return this.cache.clear();
    }
}