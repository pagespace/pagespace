var app = require('../../app.js').app,
    pagespace = require('../../app.js').pagespace,
    httpSupport = require('./support/http-support');

var doGet = httpSupport.doGet;
var doGets = httpSupport.doGets;

describe('Client sending dashboard requests', function() {


    it('cannot log into dashboard as guest', function(done) {
        doGet({
            user: 'guest',
            url: '/_dashboard',
            status: 401
        }).then(function() {
            done();
        }).catch(function(err) {
            done.fail(err);
        })
    });

    it('logs in to dashboard as editor or admin', function(done) {
        doGets({
            user: [ 'editor', 'admin' ],
            url: '/_dashboard',
            status: 200
        }).then(function(results) {
            results.forEach(function(res) {
                var html = res.text;
                expect(html).toEqual(jasmine.stringMatching(new RegExp('<title>Pagespace :: Dashboard</title>')));
            });
        }).then(function() {
            done();
        }).catch(function(err) {
            done.fail(err);
        })
    });

});