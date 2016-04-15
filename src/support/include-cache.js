'use strict';

//de[s
const 
    Promise = require('bluebird'),
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
        return new Promise((resolve, reject) => {
            this.cache.get(key, (err, val) => {
                if(err) {
                    reject(err);
                } else {
                    resolve(val);
                }
            });
        });
    }

    set(key, val, ttl) {
        return new Promise((resolve, reject) => {
            this.cache.set(key, val, ttl, (err, val) => {
                if(err) {
                    reject(err);
                } else {
                    resolve(val);
                }
            });
        });
    }

    del(key) {
        return new Promise((resolve, reject) => {
            this.cache.del(key, (err, val) => {
                if(err) {
                    reject(err);
                } else {
                    resolve(val);
                }
            });
        });
    }

    clear() {
        return new Promise((resolve, reject) => {
            this.cache.clear((err, val) => {
                if(err) {
                    reject(err);
                } else {
                    resolve(val);
                }
            });
        });
    }
}