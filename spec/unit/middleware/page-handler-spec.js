'use strict'
const
    Promise = require('bluebird'),
    createSpies = require('../helpers/spies'),
    dashboardHandler = require('../../../src/middleware/page-handler');

describe('Page Handler', () => {

    let spies, req, res, next, dbSupport, pluginResolver, viewEngine, localeResolver, logger, query, Model;
    beforeEach(() => {
        spies = createSpies();
        //(destructuring would be nice here, but I want Node4 without transpilation)
        req = spies.req;
        res = spies.res;
        next = spies.next;
        dbSupport = spies.dbSupport;
        pluginResolver = spies.pluginResolver;
        viewEngine = spies.viewEngine;
        localeResolver = spies.localeResolver;
        logger = spies.logger;
        query = spies.query;
        Model = spies.Model;

        dashboardHandler.init({
            logger: logger,
            dbSupport: dbSupport,
            pluginResolver: pluginResolver,
            viewEngine: viewEngine,
            localeResolver: localeResolver
        });

        require('../../../src/support/include-cache').init()
    });

    it('renders a live page with a 200 status', (done) => {
        req.path = '/page-1';

        const pageDataObj =  require('../fixtures/page-1.json');
        const pageDataModel = JSON.parse(JSON.stringify(pageDataObj));
        pageDataModel.toObject = () => pageDataObj;
        const findPagePromise = Promise.resolve(pageDataModel);
        query.exec.and.returnValue(findPagePromise);

        res.render.and.callFake((view, ctx, callback) => {

            //got a live model
            expect(dbSupport.getModel.calls.argsFor(0)).toEqual(['Page', 'live']);

            //correct partials are registered...
            const registerdfPartialCalls = viewEngine.registerPartial.calls;
            expect(registerdfPartialCalls.count()).toBe(3);

            const sidebarPartial = [
                'Sidebar',
                '<div data-page-id="560449ff99d5e6354d960b26" data-region="Sidebar">{{#with ctx.[0]}}<div>\n<p>pagespace-html</p>\n</div>{{/with}}</div>',
                '/page-1'
            ];
            expect(registerdfPartialCalls.argsFor(0)).toEqual(sidebarPartial);

            const mainPartial = [
                'Main',
                '<div data-page-id="560449ff99d5e6354d960b26" data-region="Main">{{#with ctx.[0]}}<div>\n<p>pagespace-nav</p>\n</div>{{/with}}\n{{#with ctx.[1]}}<div>\n<p>pagespace-webcopy</p>\n</div>{{/with}}</div>',
                '/page-1'
            ];
            expect(registerdfPartialCalls.argsFor(1)).toEqual(mainPartial);

            const footerPartial = [
                'Footer',
                '<div data-page-id="560449ff99d5e6354d960b26" data-region="Footer">{{#with ctx.[0]}}<div>\n<p>pagespace-html</p>\n</div>{{/with}}</div>',
                '/page-1'
            ];
            expect(registerdfPartialCalls.argsFor(2)).toEqual(footerPartial);

            const lastRenderCall = res.render.calls.mostRecent();
            expect(lastRenderCall.args[0]).toBe('standard.hbs');
            expect(lastRenderCall.args[1].__template).toBe('/page-1');
            expect(lastRenderCall.args[1].__locale).toBe('en');

            const renderedHtml = '<p>Page 1</p>';
            callback(null, renderedHtml);
            expect(res.send).toHaveBeenCalledWith(renderedHtml);
            done();
        });

        dashboardHandler.doGet(req, res, next);
    });

    it('renders a preview page with a 200 status', (done) => {
        req.url = '/page-1?_preview=true';
        req.path = '/page-1';
        req.query._preview = 'true'; //(meant to be a string)

        const pageDataObj =  require('../fixtures/page-1.json');
        const pageDataModel = JSON.parse(JSON.stringify(pageDataObj));
        pageDataModel.toObject = () => pageDataObj;
        const findPagePromise = Promise.resolve(pageDataModel);
        query.exec.and.returnValue(findPagePromise);

        res.render.and.callFake((view, ctx, callback) => {

            //got a live model
            expect(dbSupport.getModel.calls.argsFor(0)).toEqual(['Page', null]);

            //correct partials are registered...
            const registerdfPartialCalls = viewEngine.registerPartial.calls;
            expect(registerdfPartialCalls.count()).toBe(3);

            //match all the extra meta in preview mode
            const sideBarHtml = registerdfPartialCalls.argsFor(0)[1];
            expect(sideBarHtml).toMatch('data-plugin="pagespace-html"');
            expect(sideBarHtml).toMatch('data-page-id="560449ff99d5e6354d960b26"');
            expect(sideBarHtml).toMatch('data-region-name="Sidebar"');
            expect(sideBarHtml).toMatch('data-include="0"');
            expect(sideBarHtml).toMatch('data-include-id="5644fd37d4fcc63a3140557b"');
            expect(sideBarHtml).toMatch('<p>pagespace-html</p>');

            const mainHtml = registerdfPartialCalls.argsFor(1)[1];
            expect(mainHtml).toMatch('data-plugin="pagespace-nav"');
            expect(mainHtml).toMatch('data-page-id="560449ff99d5e6354d960b26"');
            expect(mainHtml).toMatch('data-region-name="Main"');
            expect(mainHtml).toMatch('data-include="0"');
            expect(mainHtml).toMatch('data-include-id="5644fd37d4fcc63a3140557c"');
            expect(mainHtml).toMatch('<p>pagespace-nav</p>');

            expect(mainHtml).toMatch('data-plugin="pagespace-webcopy"');
            expect(mainHtml).toMatch('data-include="1"');
            expect(mainHtml).toMatch('data-include-id="5644fd37d4fcc63a3140557d"');
            expect(mainHtml).toMatch('<p>pagespace-webcopy</p>');

            const footerHtml = registerdfPartialCalls.argsFor(2)[1];
            expect(footerHtml).toMatch('data-plugin="pagespace-html"');
            expect(footerHtml).toMatch('data-page-id="560449ff99d5e6354d960b26"');
            expect(footerHtml).toMatch('data-region-name="Footer"');
            expect(footerHtml).toMatch('data-include="0"');
            expect(footerHtml).toMatch('data-include-id="5644fd37d4fcc63a3140557e"');
            expect(footerHtml).toMatch('<p>pagespace-html</p>');

            const lastRenderCall = res.render.calls.mostRecent();
            expect(lastRenderCall.args[0]).toBe('standard.hbs');
            expect(lastRenderCall.args[1].__template).toBe('/page-1');
            expect(lastRenderCall.args[1].__locale).toBe('en');

            const renderedHtml = '<p>Page 1</p>';
            callback(null, renderedHtml);
            expect(res.send).toHaveBeenCalledWith(renderedHtml);
            done();
        });

        dashboardHandler.doGet(req, res, next);
    });

    it('caches pages in live mode', () => {
        req.path = '/page-1';

        const pageDataObj =  require('../fixtures/page-1.json');
        const pageDataModel = JSON.parse(JSON.stringify(pageDataObj));
        const findPagePromise = Promise.resolve(pageDataModel);
        query.exec.and.returnValue(findPagePromise);

        dashboardHandler.doGet(req, res, next);
        dashboardHandler.doGet(req, res, next);

        expect(Model.findOne.calls.count()).toBe(1);
    });

    it('dpes not cache pages in preview mode', () => {
        req.url = '/page-1?_preview=true';
        req.path = '/page-1';
        req.query._preview = 'true'; //(meant to be a string)

        const pageDataObj =  require('../fixtures/page-1.json');
        const pageDataModel = JSON.parse(JSON.stringify(pageDataObj));
        const findPagePromise = Promise.resolve(pageDataModel);
        query.exec.and.returnValue(findPagePromise);

        dashboardHandler.doGet(req, res, next);
        dashboardHandler.doGet(req, res, next);

        expect(Model.findOne.calls.count()).toBe(2);
    });

    it('handles permanent redirect pages', (done) => {
        req.path = '/page-2';

        const pageDataObj =  require('../fixtures/page-2.json');
        const pageDataModel = JSON.parse(JSON.stringify(pageDataObj));
        pageDataModel.status = 301;
        pageDataModel.toObject = () => pageDataObj;
        const findPagePromise = Promise.resolve(pageDataModel);
        query.exec.and.returnValue(findPagePromise);

        dashboardHandler.doGet(req, res, next);

        res.redirect.and.callFake((status, url) => {
            expect(status).toBe(301);
            expect(url).toBe('/page-3');
            done();
        });
    });

    it('handles permanent redirect pages', (done) => {
        req.path = '/page-2';
        req.path = '/page-2';

        const pageDataObj =  require('../fixtures/page-2.json');
        const pageDataModel = JSON.parse(JSON.stringify(pageDataObj));
        const findPagePromise = Promise.resolve(pageDataModel);
        query.exec.and.returnValue(findPagePromise);

        dashboardHandler.doGet(req, res, next);

        res.redirect.and.callFake((status, url) => {
            expect(status).toBe(301);
            expect(url).toBe('/page-3');
            done();
        });
    });

    it('handles temporary redirect pages', (done) => {
        req.path = '/page-4';

        const pageDataObj =  require('../fixtures/page-4.json');
        const pageDataModel = JSON.parse(JSON.stringify(pageDataObj));
        const findPagePromise = Promise.resolve(pageDataModel);
        query.exec.and.returnValue(findPagePromise);

        dashboardHandler.doGet(req, res, next);

        res.redirect.and.callFake((status, url) => {
            expect(status).toBe(302);
            expect(url).toBe('/page-3');
            done();
        });
    });

    it('handles removed pages', (done) => {
        req.path = '/page-6';

        const pageDataObj =  require('../fixtures/page-6.json');
        const pageDataModel = JSON.parse(JSON.stringify(pageDataObj));
        const findPagePromise = Promise.resolve(pageDataModel);
        query.exec.and.returnValue(findPagePromise);

        dashboardHandler.doGet(req, res, next);

        next.and.callFake(err => {
            expect(err.status).toBe(410);
            expect(err.message).toBe('The page, /page-6, has gone (410)');
            done();
        });
    });

    it('handles pages that never existed', (done) => {
        req.path = '/page-99';

        const findPagePromise = Promise.resolve(null);
        query.exec.and.returnValue(findPagePromise);

        dashboardHandler.doGet(req, res, next);

        next.and.callFake(err => {
            expect(err.status).toBe(404);
            expect(err.message).toBe('Page not found for /page-99 (404)');
            done();
        });
    })
});