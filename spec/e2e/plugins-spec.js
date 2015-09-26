var app = require('../../app.js').app,
    pagespace = require('../../app.js').pagespace,
    httpSupport = require('./support/http-support');

var doGet = httpSupport.doGet;
var doPut = httpSupport.doPut;

var page2PluginUrl = '/_plugins/data?pageId=56044a3399d5e6354d960b27&region=Main&include=1';

describe('E2E Plugin requests', function() {

    it('cannot get plugin data as guest', function (done) {
        doGet({
            user: 'guest',
            url: page2PluginUrl,
            status: 401
        }).then(function () {
            done();
        }).catch(function (err) {
            done.fail(err);
        })
    });

    it('cannot update plugin data as guest', function (done) {
        doPut({
            user: 'guest',
            url: page2PluginUrl,
            status: 401,
            body: {
                foo: 'bar'
            }
        }).then(function () {
            done();
        }).catch(function (err) {
            done.fail(err);
        })
    });

    it('can get plugin data as editor', function (done) {
        doGet({
            user: 'editor',
            url: page2PluginUrl,
            status: 200
        }).then(function (res) {
            expect(res.body).toEqual({
                cssHref: "",
                wrapperClass: "webcopy",
                html: "<p>Main content</p>"
            });
        }).then(function () {
            done();
        }).catch(function (err) {
            done.fail(err);
        })
    });

    it('can update plugin data as editor', function (done) {
        doGet({
            user: 'editor',
            url: page2PluginUrl,
            status: 200
        }).then(function (res) {
            expect(res.body).toEqual({
                cssHref: "",
                wrapperClass: "webcopy",
                html: "<p>Main content</p>"
            });

            return doPut({
                user: 'editor',
                url: page2PluginUrl,
                status: 204,
                body: {
                    cssHref: "",
                    wrapperClass: "webcopy",
                    html: "<p>New content</p>"
                }
            });
        }).then(function () {
            return doGet({
                user: 'editor',
                url: page2PluginUrl,
                status: 200
            })
        }).then(function (res) {
            expect(res.body).toEqual({
                cssHref: "",
                wrapperClass: "webcopy",
                html: "<p>New content</p>"
            });

            done();
        }).catch(function (err) {
            done.fail(err);
        })
    });
});
