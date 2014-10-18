require('./jasmine-gwt');
var httpMocks = require('express-mocks-http');
var mongooseMock = require('./mocks/mongoose');

var theApp = require('../src/index');
theApp.mongoose = mongooseMock;

var middleware;

var mockUser;
var mockReq;
var mockRes = httpMocks.createResponse();
var mockNext = function() {};

function beforeScenario() {
    mockReq = {
        LOGIN: httpMocks.createRequest({
            method: 'GET',
            url: '/_login'
        }),
        PAGE: httpMocks.createRequest({
            method: 'GET',
            url: '/two'
        }),
        API: httpMocks.createRequest({
            method: 'GET',
            url: '/_api/pages'
        }),
        ADMIN: httpMocks.createRequest({
            method: 'GET',
            url: '/_admin/dashboard'
        }),
        LOGOUT: httpMocks.createRequest({
            method: 'GET',
            url: '/_logout'
        }),
        UNKNOWN: httpMocks.createRequest({
            method: 'GET',
            url: '/geoff-capes'
        })
    };

    mockUser = {
        ADMIN: {
            role: 'admin'
        }
    };
}

scenario("Incoming requests :", function() {

    beforeScenario();

    given('a new request to a ready application', function() {

        beforeEach(function() {

            spyOn(mongooseMock, 'connect').andReturn(mongooseMock.connection);
            spyOn(mongooseMock.connection, 'once').andCallFake(function (event, callback) {
                callback();
            });

            spyOn(theApp.Page, 'find').andCallFake(function(query, callback) {
                callback(null, [{
                    url: '/one'
                },{
                    url: '/two'
                },{
                    url: '/three'
                }]);
            });
            spyOn(theApp.Part, 'find').andCallFake(function(query, callback) {
                callback(null, []);
            });
            spyOn(theApp.User, 'find').andCallFake(function(query, fields, callback) {
                callback(null, {
                    username: 'admin'
                });
            });

            theApp.reset();
            middleware = theApp.init({
                dbConnection: 'mongodb://localhost/test',
                templatesDir: '/templates',
                viewBase: '/views'
            });
        });

        when('the request is for login', function() {
            then('the login request handler should be invoked', function(done) {
                theApp.ready(function() {
                    spyOn(theApp.loginHandler, 'doRequest');
                    middleware(mockReq.LOGIN, mockRes, mockNext);
                    expect(theApp.loginHandler.doRequest).toHaveBeenCalledWith(mockReq.LOGIN, mockRes, mockNext);
                    done();
                });
            });
        });

        when('the request is for logout', function() {
            then('the logout request handler should be invoked', function(done) {
                theApp.ready(function() {
                    spyOn(theApp.logoutHandler, 'doRequest');
                    middleware(mockReq.LOGOUT, mockRes, mockNext);
                    expect(theApp.logoutHandler.doRequest).toHaveBeenCalledWith(mockReq.LOGOUT, mockRes, mockNext);
                    done()
                });
            });
        });

        when('the request is for a page', function() {
            then('the page request handler should be invoked', function(done) {
                theApp.ready(function() {
                    spyOn(theApp.pageHandler, 'doRequest');
                    middleware(mockReq.PAGE, mockRes, mockNext);
                    expect(theApp.pageHandler.doRequest).toHaveBeenCalledWith(mockReq.PAGE, mockRes, mockNext);
                    done()
                });
            });
        });

        when('the request is for an api and the user is not authorized', function() {
            then('the login request handler should be invoked', function(done) {
                theApp.ready(function() {
                    spyOn(theApp.loginHandler, 'doRequest');
                    middleware(mockReq.API, mockRes, mockNext);
                    expect(theApp.loginHandler.doRequest).toHaveBeenCalledWith(mockReq.API, mockRes, mockNext);
                    done()
                });
            });
        });

        when('the request is for an api and the user is authorized', function() {
            then('the api request handler should be invoked', function(done) {
                theApp.ready(function() {
                    mockReq.API.user = mockUser.ADMIN;
                    spyOn(theApp.apiHandler, 'doRequest');
                    middleware(mockReq.API, mockRes, mockNext);
                    expect(theApp.apiHandler.doRequest).toHaveBeenCalledWith(mockReq.API, mockRes, mockNext);
                    done()
                });
            });
        });

        when('the request is for an api and the user is not authorized', function() {
            then('the login request handler should be invoked', function(done) {
                theApp.ready(function() {
                    spyOn(theApp.loginHandler, 'doRequest');
                    middleware(mockReq.ADMIN, mockRes, mockNext);
                    expect(theApp.loginHandler.doRequest).toHaveBeenCalledWith(mockReq.ADMIN, mockRes, mockNext);
                    done()
                });
            });
        });

        when('the request is for an api and the user is authorized', function() {
            then('the admin request handler should be invoked', function(done) {
                theApp.ready(function() {
                    mockReq.ADMIN.user = mockUser.ADMIN;
                    spyOn(theApp.adminHandler, 'doRequest');
                    middleware(mockReq.ADMIN, mockRes, mockNext);
                    expect(theApp.adminHandler.doRequest).toHaveBeenCalledWith(mockReq.ADMIN, mockRes, mockNext);
                    done()
                });
            });
        });

        when('the request is not recognized', function() {
            then('the next function should be invoked with a 404 error', function(done) {
                theApp.ready(function() {
                    mockNext = jasmine.createSpy();
                    middleware(mockReq.UNKNOWN, mockRes, mockNext);
                    expect(mockNext).toHaveBeenCalled();
                    expect(mockNext.mostRecentCall.args[0].status).toEqual(404);
                    done()
                });
            });
        });
    });

    given('a new request to an unready application', function() {

        beforeEach(function() {

            spyOn(mongooseMock, 'connect').andReturn(mongooseMock.connection);
            spyOn(mongooseMock.connection, 'once').andCallFake(function (event, callback) {
                callback();
            });

            spyOn(theApp.Page, 'find').andCallFake(function(query, callback) {
                callback(null, []);
            });
            spyOn(theApp.Part, 'find').andCallFake(function(query, callback) {
                //callback(null, []);
            });
            spyOn(theApp.User, 'find').andCallFake(function(query, fields, callback) {
                callback(null, {
                    username: 'admin'
                });
            });

            theApp.reset();
            middleware = theApp.init({
                dbConnection: 'mongodb://localhost/test',
                templatesDir: '/templates',
                viewBase: '/views'
            });
        });

        when('a request is processed', function() {
            then('the next function should be invoked with a 503 error', function() {
                mockNext = jasmine.createSpy();
                middleware(mockReq.LOGIN, mockRes, mockNext);
                expect(mockNext).toHaveBeenCalled();
                expect(mockNext.mostRecentCall.args[0].status).toEqual(503);
            });
        });
    });
});