var httpSupport = require('./support/http-support');

var doGet = httpSupport.doGet
var doPost = httpSupport.doPost;

describe('Client sending authentication requests', function() {

    it('can log in and logs out', function(done) {

        doGet({
            user: 'guest',
            url: '/_dashboard',
            status: 401
        }).then(function() {
            return doPost({
                user: 'guest',
                url: '/_auth/login',
                status: 200,
                body: { username: 'editor', password: 'editor' }
            });
        }).then(function() {
            return doGet({
                user: 'guest',
                url: '/_dashboard',
                status: 200
            })
        }).then(function() {
            return doGet({
                user: 'guest',
                url: '/_auth/logout',
                status: 302
            })
        }).then(function() {
            return doGet({
                user: 'guest',
                url: '/_dashboard',
                status: 401
            });
        }).then(function() {
            done()
        }).catch(function(err) {
            done.fail(err);
        })
    });

    it('cannot login with a bad username', function(done) {
        doPost({
            user: 'guest',
            url: '/_auth/login',
            status: 401,
            body: { username: 'wrong', password: 'editor' }
        }).then(function() {
            return doGet({
                user: 'guest',
                url: '/_dashboard',
                status: 401
            });
        }).then(function() {
            done();
        }).catch(function(err) {
            done.fail(err);
        })
    });

    it('cannot login with a bad password', function(done) {
        doPost({
            user: 'guest',
            url: '/_auth/login',
            status: 401,
            body: { username: 'editor', password: 'WRONG' }
        }).then(function() {
            return doGet({
                user: 'guest',
                url: '/_dashboard',
                status: 401
            });
        }).then(function() {
            done();
        }).catch(function(err) {
            done.fail(err);
        })
    });

});