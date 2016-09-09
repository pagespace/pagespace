'use strict'
const
    Promise = require('bluebird'),
    createSpies = require('../helpers/spies'),
    publishingHandler = require('../../../src/middleware/publishing-handler');

describe('Publishing Handler', () => {

    let spies, req, res, next, dbSupport, logger, query, Model, testUtil;
    beforeEach(() => {
        //(destructuring would be nice here, but I want Node4 without transpilation)
        spies = createSpies();
        req = spies.req;
        res = spies.res;
        next = spies.next;
        dbSupport = spies.dbSupport;
        logger = spies.logger;
        query = spies.query;
        Model = spies.Model;
        testUtil = spies.testUtil;

        publishingHandler.init({
            logger: logger,
            dbSupport: dbSupport
        });

        require('../../../src/support/include-cache').init();

        jasmine.clock().install();
    });

    afterEach(() => {
        jasmine.clock().uninstall();
    });

    it('publishes pages', (done) => {
        req.path = '/_publish';
        req.body = [ "560450f5b42fff62527b40f2", "560450fcb42fff62527b40f3" ];

        //mock mongoose toObject() methods
        const draftPages =  require('../fixtures/draft-pages.json');
        testUtil.mongooseify(draftPages, {
            save: Promise.resolve({ name: 'fooy' })
        });

        const draftPagesResult = Promise.resolve(draftPages);

        query.exec.and.returnValue(draftPagesResult);

        Model.update.and.returnValue(Promise.resolve({}));

        const baseDate = new Date(2016, 2, 29, 23, 46);
        jasmine.clock().mockDate(new Date(2016, 2, 29, 23, 46));
        const updatedAt = baseDate.getTime();

        publishingHandler.doPost(req, res, next);

        res.json.and.callFake(response => {

            let nextUpdateCall;
            const updates = Model.update.calls;
            let count = 0;

            // page[0] live page update
            nextUpdateCall = updates.argsFor(count++);
            expect(nextUpdateCall[0]).toEqual({ _id: '560450f5b42fff62527b40f2' });
            expect(nextUpdateCall[1]).toEqual(jasmine.objectContaining({
                updatedAt: updatedAt,
                updatedBy: req.user._id,
                published: true,
                draft: false
            }));

            //page[0] template update
            nextUpdateCall = updates.argsFor(count++);
            expect(nextUpdateCall[0]).toEqual({ _id: '5604446c99d5e6354d960b0f' });

            let includeIds = [
                '5644fd37d4fcc63a314055b3', //sidebar
                '5644fd37d4fcc63a314055b4', //nav
                '5644fd37d4fcc63a314055b5', //main
                '5644fd37d4fcc63a314055b6', //footer
            ];

            //page[0] includes
            //double up for draft and live update checks
            includeIds = includeIds.reduce((arr, id) => {
                arr.push(id);
                arr.push(id);
                return arr;
            }, []);

            for(let id of includeIds) {
                //page[0] draft include sidebar update
                nextUpdateCall = updates.argsFor(count++);
                expect(nextUpdateCall[0]).toEqual({ _id: id });
            }

            // page[1] live page update
            nextUpdateCall = updates.argsFor(count++);
            expect(nextUpdateCall[0]).toEqual({ _id: '560450fcb42fff62527b40f3' });
            expect(nextUpdateCall[1]).toEqual(jasmine.objectContaining({
                updatedAt: updatedAt,
                updatedBy: req.user._id,
                published: true,
                draft: false
            }));

            //page[1] template update
            nextUpdateCall = updates.argsFor(count++);
            expect(nextUpdateCall[0]).toEqual({ _id: '560450fcb42fff62527b40f3' });

            //page[1] only non-shared include, draft
            nextUpdateCall = updates.argsFor(count++);
            expect(nextUpdateCall[0]).toEqual({ _id: '5644fd37d4fcc63a314055b9' });
            //live
            nextUpdateCall = updates.argsFor(count++);
            expect(nextUpdateCall[0]).toEqual({ _id: '5644fd37d4fcc63a314055b9' });

            expect(updates.count()).toBe(14)

            expect(draftPages[0].save).toHaveBeenCalled();
            expect(draftPages[1].save).toHaveBeenCalled();

            //send response
            expect(res.status).toHaveBeenCalledWith(200);
            expect(response.message).toBe('Published 2 pages and 5 includes');
            expect(response.publishCount).toBe(16);
            done()
        });
    });

    it('reverts drafts', (done) => {
        req.path = '/_publish';
        req.body = { pageId: '560449ff99d5e6354d960b26' };

        //mock mongoose toObject() methods
        const livePage =  require('../fixtures/page-1.json');
        testUtil.mongooseify(livePage);
        const livePageResult = Promise.resolve(livePage);

        query.exec.and.returnValue(livePageResult);

        publishingHandler.doPut(req, res, next);

        res.send.and.callFake(() => {
            //send response
            expect(Model.findByIdAndUpdate).toHaveBeenCalledWith(req.body.pageId, jasmine.objectContaining({
                draft: false
            }), { overwrite: true });
            expect(res.status).toHaveBeenCalledWith(204);
            done()
        });
    });
});