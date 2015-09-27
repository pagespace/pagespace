var app = require('../../app.js').app,
    pagespace = require('../../app.js').pagespace,
    httpSupport = require('./support/http-support');

var doGet = httpSupport.doGet;
var doPost = httpSupport.doPost;
var publishedAlready = [ '560449ff99d5e6354d960b26', '56044a6c99d5e6354d960b2a', '56044a7499d5e6354d960b2b' ];
var toPublish = ["560450f5b42fff62527b40f2","560450fcb42fff62527b40f3","56045103b42fff62527b40f4"];

describe('Client sending publishing requests', function() {

    it('cannot publish as guest', function (done) {
        doPost({
            user: 'guest',
            url: '/_publish/pages',
            status: 401
        }).then(function (results) {
            done();
        }).catch(function (err) {
            done.fail(err);
        })
    });

    it('cannot publish pages not in draft', function (done) {
        doPost({
            user: 'editor',
            url: '/_publish/pages',
            status: 200,
            body: publishedAlready
        }).then(function (res) {
            expect(res.body.publishCount).toBe(0);
            done();
        }).catch(function (err) {
            done.fail(err);
        })
    });

    it('publishes pages', function (done) {

        //verify pages are not published
        doGet({
            user: 'guest',
            url: '/page-5',
            status: 404
        }).then(function () {
            return doGet({
                user: 'guest',
                url: '/page-5/page-5-1',
                status: 404
            });
        }).then(function () {
            return doGet({
                user: 'guest',
                url: '/page-5/page-5-1/page-5-1-2',
                status: 404
            });
        }).then(function () {
            return doPost({
                user: 'editor',
                url: '/_publish/pages',
                status: 200,
                body: toPublish
            });
        }).then(function (res) {
            //3 x live pages, 3 x live templates, 1 x draft page = 7 updates
            expect(res.body.publishCount).toBe(7);
            return doGet({
                user: 'guest',
                url: '/page-5',
                status: 200
            });
        }).then(function () {
            return doGet({
                user: 'guest',
                url: '/page-5/page-5-1',
                status: 200
            });
        }).then(function () {
            return doGet({
                user: 'guest',
                url: '/page-5/page-5-1/page-5-1-2',
                status: 200
            });
        }).then(function () {
            done();
        }).catch(function (err) {
            done.fail(err);
        })
    });

});
