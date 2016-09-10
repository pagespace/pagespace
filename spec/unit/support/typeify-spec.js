'use strict';
const
    typeify = require('../../../src/support/typeify');

describe('typeify', () => {
    
    it('converts to undefined to null ', () => {
        const x = {};
        expect(typeify(x.foo)).toBe(null);
    });

    it('converts strings to booleans ', () => {
        expect(typeify('true')).toBe(true);
        expect(typeify('false')).toBe(false);
    });

    it('converts to strings to numbers ', () => {
        expect(typeify('5')).toBe(5);
        expect(typeify('3.14')).toBe(3.14);
    });

    it('converts to strings to regexes ', () => {
        expect(typeify('/^foo/').toString()).toBe(new RegExp('^foo').toString());
    });

    it('converts to strings to strings ', () => {
        expect(typeify('nothing special')).toBe('nothing special');
    });
});