require('../support/jasmine-gwt');

var util = require('../../src/misc/util');

scenario("Page space utils :", function() {

    given('a request contains typed values in the query string', function () {

        when("the value could be a number", function () {
            var value = "99";
            then("the value is converted to a number", function () {
                expect(util.typeify(value)).toBe(99);
            });
        });
        when("the value could be a boolean", function () {
            var t = "true";
            var f = "false";
            then("the true value is a boolean", function () {
                expect(util.typeify(t)).toBe(true);
            });
            then("the true value is a boolean", function () {
                expect(util.typeify(f)).toBe(false);
            });
        });
    });
});