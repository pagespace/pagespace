require('./jasmine-gwt');
var httpMocks = require('express-mocks-http');
var mongooseMock = require('./mocks/mongoose');
var mongooseModelMock = require('./mocks/mongoose-model');
var consts = require('../src/app-constants');

var pagespace = require('../src/index');
pagespace.mongoose = mongooseMock;

var middleware;

var mockUser;
var mockReq;
var mockRes = httpMocks.createResponse();
var mockNext = function() {};
var MockRequestHandler = function() {};
MockRequestHandler.prototype._doRequest = function(req, re, next) {};

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
        DASHBOARD: httpMocks.createRequest({
            method: 'GET',
            url: '/_admin/dashboard'
        }),
        LOGOUT: httpMocks.createRequest({
            method: 'GET',
            url: '/_logout'
        }),
        MEDIA: httpMocks.createRequest({
            method: 'GET',
            url: '/_media/one.png'
        }),
        PUBLISHING: httpMocks.createRequest({
            method: 'GET',
            url: '/_publish/pages'
        })
    };

    mockUser = {
        GUEST: {
            role: 'guest'
        },
        ADMIN: {
            role: 'admin'
        }
    };
}

scenario("Incoming requests :", function() {

    beforeScenario();

    given('a new request is made', function() {
        beforeEach(function() {

            spyOn(mongooseMock, 'connect').andReturn(mongooseMock.connection);
            spyOn(mongooseMock.connection, 'once').andCallFake(function (event, callback) {
                callback();
            });

            spyOn(pagespace.dbSupport, 'getModel').andCallFake(function(schema) {

                function data(schema) {
                    if(schema === 'Part') {
                        return [];
                    } else if(schema === 'User') {
                        return [{
                            username: 'admin',
                            role: 'admin'
                        }]
                    }
                }

                var model = mongooseModelMock;
                model.data = data(schema);
                return model;
            });

            spyOn(pagespace.dbSupport, 'initModels').andCallFake(function() {});

            //mock handlers
            pagespace.createPageHandler = function() { return new MockRequestHandler() };
            pagespace.createApiHandler = function() { return new MockRequestHandler() };
            pagespace.createAdminHandler = function() { return new MockRequestHandler() };
            pagespace.createPublishingHandler = function() { return new MockRequestHandler() };
            pagespace.createDataHandler = function() { return new MockRequestHandler() };
            pagespace.createMediaHandler = function() { return new MockRequestHandler() };
            pagespace.createLoginHandler = function() { return new MockRequestHandler() };
            pagespace.createLogoutHandler = function() { return new MockRequestHandler() };

            pagespace.reset();
            middleware = pagespace.init({
                db: 'mongodb://localhost/test',
                mediaDir: null,
                logLevel: "debug"
            });
        });

        when('the request is for login', function() {
            then('the login request handler should be invoked', function() {
                var mockHandler = pagespace.urlHandlerMap[consts.requests.LOGIN];
                spyOn(mockHandler, '_doRequest');
                middleware(mockReq.LOGIN, mockRes, mockNext);
                expect(mockHandler._doRequest).toHaveBeenCalledWith(mockReq.LOGIN, mockRes, mockNext);
            });
        });

        when('the request is for logout', function() {
            then('the logout request handler should be invoked', function() {
                var mockHandler = pagespace.urlHandlerMap[consts.requests.LOGOUT];
                spyOn(mockHandler, '_doRequest');
                middleware(mockReq.LOGOUT, mockRes, mockNext);
                expect(mockHandler._doRequest).toHaveBeenCalledWith(mockReq.LOGOUT, mockRes, mockNext);
            });
        });

        when('the request is for a page', function() {
            then('the page request handler should be invoked', function() {
                var mockHandler = pagespace.urlHandlerMap[consts.requests.PAGE];
                spyOn(mockHandler, '_doRequest');
                middleware(mockReq.PAGE, mockRes, mockNext);
                expect(mockHandler._doRequest).toHaveBeenCalledWith(mockReq.PAGE, mockRes, mockNext);
            });
        });

        when('the request is for an api and the user is not authorized', function() {
            then('the api request handler should be invoked', function() {
                mockReq.API.user = mockUser.GUEST;
                var mockHandler = pagespace.urlHandlerMap[consts.requests.LOGIN];
                spyOn(mockHandler, '_doRequest');
                middleware(mockReq.API, mockRes, mockNext);
                expect(mockHandler._doRequest).toHaveBeenCalledWith(mockReq.API, mockRes, mockNext);
            });
        });

        when('the request is for an api and the user is authorized', function() {
            then('the api request handler should be invoked', function() {
                mockReq.API.user = mockUser.ADMIN;
                var mockHandler = pagespace.urlHandlerMap[consts.requests.API];
                spyOn(mockHandler, '_doRequest');
                middleware(mockReq.API, mockRes, mockNext);
                expect(mockHandler._doRequest).toHaveBeenCalledWith(mockReq.API, mockRes, mockNext);
            });
        });

        when('the request is for the admin dashboard and the user is not authorized', function() {
            then('the login request handler should be invoked', function() {
                mockReq.DASHBOARD.user = mockUser.GUEST;
                var mockHandler = pagespace.urlHandlerMap[consts.requests.LOGIN];
                spyOn(mockHandler, '_doRequest');
                middleware(mockReq.DASHBOARD, mockRes, mockNext);
                expect(mockHandler._doRequest).toHaveBeenCalledWith(mockReq.DASHBOARD, mockRes, mockNext);
            });
        });

        when('the request is for an api and the user is authorized', function() {
            then('the admin request handler should be invoked', function() {
                mockReq.DASHBOARD.user = mockUser.ADMIN;
                var mockHandler = pagespace.urlHandlerMap[consts.requests.ADMIN];
                spyOn(mockHandler, '_doRequest');
                middleware(mockReq.DASHBOARD, mockRes, mockNext);
                expect(mockHandler._doRequest).toHaveBeenCalledWith(mockReq.DASHBOARD, mockRes, mockNext);
            });
        });

        when('the request is to get media and the user is not authorized', function() {
            then('the media request handler should be invoked', function() {
                mockReq.MEDIA.user = mockUser.GUEST;
                var mockHandler = pagespace.urlHandlerMap[consts.requests.MEDIA];
                spyOn(mockHandler, '_doRequest');
                middleware(mockReq.MEDIA, mockRes, mockNext);
                expect(mockHandler._doRequest).toHaveBeenCalledWith(mockReq.MEDIA, mockRes, mockNext);
            });
        });

        when('the request is to upload media and the user is not authorized', function() {
            then('the login request handler should be invoked', function() {
                mockReq.MEDIA.user = mockUser.GUEST;
                mockReq.MEDIA.method = 'POST';
                var mockHandler = pagespace.urlHandlerMap[consts.requests.LOGIN];
                spyOn(mockHandler, '_doRequest');
                middleware(mockReq.MEDIA, mockRes, mockNext);
                expect(mockHandler._doRequest).toHaveBeenCalledWith(mockReq.MEDIA, mockRes, mockNext);
            });
        });

        when('the request is to get the publishing queue and the user is not authorized', function() {
            then('the login request handler should be invoked', function() {
                mockReq.PUBLISHING.user = mockUser.GUEST;
                var mockHandler = pagespace.urlHandlerMap[consts.requests.LOGIN];
                spyOn(mockHandler, '_doRequest');
                middleware(mockReq.PUBLISHING, mockRes, mockNext);
                expect(mockHandler._doRequest).toHaveBeenCalledWith(mockReq.PUBLISHING, mockRes, mockNext);
            });
        });

        when('the request is to publish items and the user is not authorized', function() {
            then('the login request handler should be invoked', function() {
                mockReq.PUBLISHING.user = mockUser.GUEST;
                mockReq.PUBLISHING.method = 'POST';
                var mockHandler = pagespace.urlHandlerMap[consts.requests.LOGIN];
                spyOn(mockHandler, '_doRequest');
                middleware(mockReq.PUBLISHING, mockRes, mockNext);
                expect(mockHandler._doRequest).toHaveBeenCalledWith(mockReq.PUBLISHING, mockRes, mockNext);
            });
        });

        when('the middleware is not ready', function() {
            then('the next function should be invoked with a 503 error', function() {
                pagespace.appState = consts.appStates.NOT_READY;
                mockNext = jasmine.createSpy();
                middleware(mockReq.LOGIN, mockRes, mockNext);
                expect(mockNext).toHaveBeenCalled();
                expect(mockNext.mostRecentCall.args[0].status).toEqual(503);
            });
        });
    });
});