var Promise = require('bluebird'),
    httpSupport = require('./support/http-support');

var doGet = httpSupport.doGet
var doGets = httpSupport.doGets;

describe('Client sending static requests', function() {

    it('can get static assets as any role', function(done) {
        var p1 = doGets({
            user: [ 'guest', 'editor', 'admin' ],
            url: '/_static/dashboard/build/admin-app.js',
            status: 200
        });

        var p2 = doGets({
            user: [ 'guest', 'editor', 'admin' ],
            url: '/_static/dashboard/styles/styles.css',
            status: 200
        });

        var p3 = doGets({
            user: [ 'guest', 'editor', 'admin' ],
            url: '/_static/inpage/inpage-edit.js',
            status: 200
        });

        var p4 = doGets({
            user: [ 'guest', 'editor', 'admin' ],
            url: '/_static/inpage/inpage-edit.css',
            status: 200
        });

        Promise.all([ p1, p2, p3, p4]).then(function() {
            done();
        }).catch(function(err) {
            done.fail(err);
        });
    });
});