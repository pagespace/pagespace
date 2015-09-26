var util = require('../../src/support/pagespace-util');

describe('Pagespace utils', function() {

    describe('typeify', function() {

        it('converts to undefined to null ', function() {
            var x = {}
            expect(util.typeify(x.foo)).toBe(null);
        });

        it('converts strings to booleans ', function() {
            expect(util.typeify('true')).toBe(true);
            expect(util.typeify('false')).toBe(false);
        });

        it('converts to strings to numbers ', function() {
            expect(util.typeify('5')).toBe(5);
            expect(util.typeify('3.14')).toBe(3.14);
        });

        it('converts to strings to regexes ', function() {
            expect(util.typeify('/^foo/').toString()).toBe(new RegExp('^foo').toString());
        });

        it('converts to strings to strings ', function() {
            expect(util.typeify('nothing special')).toBe('nothing special');
        });

    });
});