'use strict';
const
    Promise = require('bluebird'),
    includeCache = require('../../../src/support/include-cache');

describe('Include cache', () => {

    let cache;
    beforeEach(() => {
        includeCache.init();
        cache = includeCache.getCache();
    });
    const EXISTS = 'exists';
    const NOT_EXISTS = 'not_exists';

    it('sets and gets and deletes', (done) => {

        cache.get(NOT_EXISTS).then(val => {
            expect(val).toBeUndefined();
            //set
            return cache.set(EXISTS, 123);
        }).then(val => {
            expect(val).toBe(123);

            //get
            return cache.get(EXISTS);
        }).then(val => {
            expect(val).toBe(123);

            //delete
            return cache.del(EXISTS);
        }).then(val => {
            //(returns null after delete)
            expect(val).toBeNull();

            //get should now throw
            return cache.get(EXISTS);
        }).then(val => {
            expect(val).toBeUndefined();

            //test setting a multiple so we can test clear
            return Promise.all([ cache.set('one', 1), cache.set('two', 2) ]);
        }).then(vals => {
            expect(vals[0]).toBe(1);
            expect(vals[1]).toBe(2);
            return cache.clear()
        }).then(() => {
            //none of these should resolve
            return Promise.all([ cache.get('one'), cache.set('two') ], 1);
        }).then(val => {
            expect(val).toEqual([ undefined, undefined ]);

            done();
        }).catch(err => {
            done.fail(err);
        });
    });
});