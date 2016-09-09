'use strict'
const
    path = require('path'),
    createSpies = require('../helpers/spies'),
    templatesHandler = require('../../../src/middleware/templates-handler');

describe('Publishing Handler', () => {

    let spies, req, res, next, logger;
    beforeEach(() => {
        //(destructuring would be nice here, but I want Node4 without transpilation)
        spies = createSpies();
        req = spies.req;
        res = spies.res;
        next = spies.next;
        logger = spies.logger;

        templatesHandler.init({
            logger: logger,
        });

    });

    it('gets available pages', (done) => {
        req.path = '/_templates/available';

        req.app.get.and.returnValue([
            path.join(__dirname, '../fixtures/templates/dir_1'),
            path.join(__dirname, '../fixtures/templates/dir_2')
        ]);

        templatesHandler.doGet(req, res, next);

        res.json.and.callFake(files => {
            expect(files).toEqual([
                "one.hbs",
                "two.hbs",
                "three.hbs",
                "sub/region-partials.hbs"
            ]);
            done();
        })
    });

    it('gets templates regions from a template file', (done) => {
        req.path = '/_templates/template-regions';

        req.app.get.and.returnValue([
            path.join(__dirname, '../fixtures/templates/dir_1'),
            path.join(__dirname, '../fixtures/templates/dir_2')
        ]);
        req.query.templateSrc = 'sub/region-partials.hbs';

        templatesHandler.doGet(req, res, next);

        res.json.and.callFake(files => {
            expect(files).toEqual([
                "Sidebar",
                "Main",
                "Footer"
            ]);
            done();
        })
    });
});