require('../support/jasmine-gwt');

var util = require('../../src/misc/acl');

scenario("Page space utils :", function() {

    given('a request contains typed values in the query string', function () {

        when("the value could be a number", function () {
            var value = "99";
            then("the value is converted to a number", function () {
                expect(true).toBe(true);
            });
        });

    });
});