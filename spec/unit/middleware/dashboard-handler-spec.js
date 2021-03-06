'use strict';
const
    createSpies = require('../helpers/spies'),
    dashboardHandler = require('../../../src/middleware/dashboard-handler');

describe('Dashboard Handler', () => {

    let spies, req, res, next, logger;
    beforeEach(() => {
        //(destructuring would be nice here, but I want Node4 without transpilation)
        spies = createSpies();
        req = spies.req;
        res = spies.res;
        next = spies.next;
        logger = spies.logger;

        dashboardHandler.init({
            logger: logger,
            imageVariations: 'VARIATIONS'
        });
    });

    describe('renders the dashboard and ', () => {
        it('renders the dashboard', (done) => {
            req.path = '/_dashboard';

            const html = '<p>dashboard</p>'

            const expectedCtx = {
                username: 'Mr User',
                displayName: 'mruser',
                allowAdminFeatures: false,
                allowDeveloperFeatures: true,
                year: '2016'
            };

            res.render.and.callFake((view, ctx, callback) => {

                expect(view).toBe('dashboard.hbs');
                expect(ctx.version).not.toBeUndefined();
                delete ctx.version;
                expect(ctx).toEqual(expectedCtx);
                callback(null, html);
                expect(res.send).toHaveBeenCalledWith(html);
                done();
            });

            dashboardHandler.doGet(req, res, next);
        });

        it('renders the inpage view', (done) => {
            req.path = '/_dashboard/inpage';

            const html = '<p>inpage</p>'

            res.render.and.callFake((view, ctx, callback) => {

                expect(view).toBe('inpage.hbs');
                callback(null, html);
                expect(res.send).toHaveBeenCalledWith(html);
                done();
            });

            dashboardHandler.doGet(req, res, next);
        });

        it('provides settings', () => {
            req.path = '/_dashboard/settings';

            dashboardHandler.doGet(req, res, next);

            expect(res.json).toHaveBeenCalledWith({ imageVariations: 'VARIATIONS' });
        });

        it('handles rendering errors', (done) => {
            req.path = '/_dashboard/inpage';
            res.render.and.callFake((view, ctx, callback) => {
                callback(new Error('doh!'));
                expect(next).toHaveBeenCalled();
                done();
            });

            dashboardHandler.doGet(req, res, next);
        });

        it('handles unrecognized url patterns', () => {
            req.path = '/_/inpage';
            expect(() =>  dashboardHandler.doGet(req, res, next)).toThrow();
        });
    });
});