var app = require('../../app.js').app,
    pagespace = require('../../app.js').pagespace,
    httpSupport = require('./support/http-support');

var doGet = httpSupport.doGet
var doGets = httpSupport.doGets;
var doPosts = httpSupport.doPosts;
var doPuts = httpSupport.doPuts;
var doDels = httpSupport.doDels;

describe('Client sending page request', function() {

    it('gets a live page as guest', function(done) {
        doGet({
            user: 'guest',
            url: '/page-2/page-2-1',
            status: 200
        }).then(function(res) {
            var html = res.text;
            expect(html).toEqual(jasmine.stringMatching(new RegExp('<!DOCTYPE html>')));
            expect(html).toEqual(jasmine.stringMatching(new RegExp('<h1>Page 2-1</h1>')));
            expect(html).toEqual(jasmine.stringMatching(new RegExp('<p>Sidebar HTML</p>')));
            expect(html).toEqual(jasmine.stringMatching(new RegExp('<p>Main content</p>')));
            expect(html).toEqual(jasmine.stringMatching(new RegExp('<p>Footer HTML</p>')));
            done()
        }).catch(function(err) {
            done.fail(err);
        });
    });

    it('cannot get an unpublished page', function(done) {
        doGets({
            user: [ 'guest', 'editor', 'admin' ],
            url: '/page-5',
            status: 404
        }).then(function() {
            done()
        }).catch(function(err) {
            done.fail(err);
        });
    });

    it('cannot get an unpublished page as guest attempting preview mode', function(done) {
        doGet({
            user: 'guest',
            url: '/page-5?_preview=true',
            status: 404
        }).then(function() {
            done()
        }).catch(function(err) {
            done.fail(err);
        });
    });

    it('cannot get an unpublished page as admin or editor in live mode', function(done) {
        doGets({
            user: [ 'editor', 'admin' ],
            url: '/page-5',
            status: 404
        }).then(function() {
            done()
        }).catch(function(err) {
            done.fail(err);
        });
    });

    it('can get an unpublished page as admin or editor in preview mode', function(done) {
        doGets({
            user: [ 'editor', 'admin' ],
            url: '/page-5?_preview=true',
            status: 200
        }).then(function(results) {
            results.forEach(function(res) {
                expect(res.text).toEqual(jasmine.stringMatching(new RegExp('<h1>Page 5</h1>')));
            });
            done()
        }).catch(function(err) {
            done.fail(err);
        });
    });

    it('cannot send a POST to a page', function(done) {
        doPosts({
            user: [ 'guest', 'editor', 'admin' ],
            url: '/page-1',
            status: 405
        }).then(function() {
            done()
        }).catch(function(err) {
            done.fail(err);
        });
    });

/*    it('cannot send a PUT to a page', function(done) {
        doPuts({
            user: [ 'guest', 'editor', 'admin' ],
            url: '/page-1',
            status: 403
        }).then(function() {
            done()
        }).catch(function(err) {
            done.fail(err);
        });
    });

    it('cannot send a DELETE to a page', function(done) {
        doDels({
            user: [ 'guest', 'editor', 'admin' ],
            url: '/page-1',
            status: 403
        }).then(function() {
            done()
        }).catch(function(err) {
            done.fail(err);
        });
    });*/
});