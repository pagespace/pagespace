'use strict';
const
    rewire = require('rewire'),
    createSpies = require('../helpers/spies'),
    staticHandler = rewire('../../../src/middleware/static-handler');

describe('Static Handler', () => {

    let spies, req, res, next, logger, pluginResolver, mockServeStatic, staticServer;
    beforeEach(() => {
        //(destructuring would be nice here, but I want Node4 without transpilation)
        spies = createSpies();
        req = spies.req;
        res = spies.res;
        next = spies.next;
        logger = spies.logger;
        pluginResolver = spies.pluginResolver;

        mockServeStatic = jasmine.createSpy('serveStatic');
        staticServer = jasmine.createSpy('staticServer');
        mockServeStatic.and.returnValue(staticServer);
        staticHandler.__set__('serveStatic', mockServeStatic);

        staticHandler.init({
            logger: logger,
            pluginResolver: pluginResolver
        });
    });

    it('it serves dashboard pages', (done) => {
        req.path = '/_static/dashboard/build/admin-app.js';

        staticServer.and.callFake((req, res, next) => {
            expect(req.url).toBe('/dashboard/build/admin-app.js');
            expect(res).toBe(res);
            expect(next).toBe(next);
            done();
        });

        staticHandler.doGet(req, res, next);
    });

    it('it serves plugins static assets', (done) => {
        req.path = '/_static/plugins/pagespace-webcopy/asset.js';

        staticServer.and.callFake((req, res, next) => {
            expect(mockServeStatic).toHaveBeenCalledWith('/plugins/pagespace-webcopy', jasmine.anything());
            expect(req.url).toBe('/static/asset.js');
            expect(res).toBe(res);
            expect(next).toBe(next);
            done();
        });

        staticHandler.doGet(req, res, next);
    });
});