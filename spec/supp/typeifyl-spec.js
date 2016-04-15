var typeify = require('../../src/support/typeify');

describe('typeify', function() {
    
    it('converts to undefined to null ', function() {
        var x = {}
        expect(typeify(x.foo)).toBe(null);
    });

    it('converts strings to booleans ', function() {
        expect(typeify('true')).toBe(true);
        expect(typeify('false')).toBe(false);
    });

    it('converts to strings to numbers ', function() {
        expect(typeify('5')).toBe(5);
        expect(typeify('3.14')).toBe(3.14);
    });

    it('converts to strings to regexes ', function() {
        expect(typeify('/^foo/').toString()).toBe(new RegExp('^foo').toString());
    });

    it('converts to strings to strings ', function() {
        expect(typeify('nothing special')).toBe('nothing special');
    });
});