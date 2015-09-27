var app = require('../../app.js').app,
    pagespace = require('../../app.js').pagespace,
    httpSupport = require('./support/http-support');

var doGet = httpSupport.doGet;
var doGets = httpSupport.doGets;

describe('Client sending general API requests', function() {

    // -- General--------------------------------------------------------------

    it('receives 403 response for unrecognized API urls', function (done) {
        doGets({
            user: 'admin',
            url: '/_api/cats',
            status: 403
        }).then(function () {
            done();
        }).catch(function (err) {
            done.fail(err);
        })
    });

    it('filters requests by boolean fields', function (done) {
        doGet({
            user: 'admin',
            url: '/_api/pages?useInNav=true',
            status: 200
        }).then(function (res) {
            var pages = res.body;
            pages.forEach(function(page) {
                expect(page.useInNav).toBe(true);
            });
            done();
        }).catch(function (err) {
            done.fail(err);
        })
    });

    it('filters requests by number fields', function (done) {
        doGet({
            user: 'admin',
            url: '/_api/pages?order=0',
            status: 200
        }).then(function (res) {
            var pages = res.body;
            pages.forEach(function(page) {
                expect(page.order).toBe(0);
            });
            done();
        }).catch(function (err) {
            done.fail(err);
        })
    });

    it('filters requests by regex fields', function (done) {
        doGet({
            user: 'admin',
            url: '/_api/pages?url=' + encodeURIComponent('/^/page-4/'),
            status: 200
        }).then(function (res) {
            var pages = res.body;
            pages.forEach(function(page) {
                expect(page.url.indexOf('/page-4')).toBe(0);
            });
            done();
        }).catch(function (err) {
            done.fail(err);
        })
    });
});