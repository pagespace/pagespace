'use strict'
const
    rewire = require('rewire'),
    Promise = require('bluebird'),
    createSpies = require('../helpers/spies'),
    mediaHandler = rewire('../../../src/middleware/media-handler');

describe('Page Handler', () => {

    let spies, req, res, next, dbSupport, logger, query, Model, send, stream;
    beforeEach(() => {
        spies = createSpies();
        //(destructuring would be nice here, but I want Node4 without transpilation)
        req = spies.req;
        res = spies.res;
        next = spies.next;
        dbSupport = spies.dbSupport;
        logger = spies.logger;
        query = spies.query;
        Model = spies.Model;
        send = spies.send;
        stream = spies.stream;

        mediaHandler.init({
            logger: logger,
            dbSupport: dbSupport,
            mediaDir: '/my-media',
            imageVariations: {}
        });
    });

    it('streams a media item', (done) => {

        mediaHandler.__set__('send', send);

        req.url = '/_media/logo.png';
        req.path = '/_media/logo.png';

        const mediaModel =  require('../fixtures/media-logo.json');
        const findMediaPromise = Promise.resolve(mediaModel);
        query.exec.and.returnValue(findMediaPromise);

        send.and.callFake((_req, mediaPath) => {
            expect(_req).toBe(req);
            expect(mediaPath).toBe('/my-media/logo.png');
            return stream;
        });

        stream.pipe.and.callFake(_res => {
            expect(_res).toBe(res);
            done();
        });

        mediaHandler.doGet(req, res, next);
    });

    it('streams a media item variation', (done) => {

        mediaHandler.__set__('send', send);

        req.url = '/_media/logo.png?label=thumb';
        req.path = '/_media/logo.png';
        req.query.label = 'thumb';

        const mediaModel =  require('../fixtures/media-logo.json');
        const findMediaPromise = Promise.resolve(mediaModel);
        query.exec.and.returnValue(findMediaPromise);

        send.and.callFake((_req, mediaPath) => {
            expect(_req).toBe(req);
            expect(mediaPath).toBe('/my-media/logo.thumb.png');
            return stream;
        });

        stream.pipe.and.callFake(() => {
            done();
        });

        mediaHandler.doGet(req, res, next);
    });

    it('deletes a media item', (done) => {

        const unlinkAsync = jasmine.createSpy('unlinkAsync');
        mediaHandler.__set__('unlinkAsync', unlinkAsync);

        req.url = '/_media/logo.png';
        req.path = '/_media/logo.png';

        const mediaModel =  require('../fixtures/media-logo.json');
        const findMediaPromise = Promise.resolve(mediaModel);
        query.exec.and.returnValue(findMediaPromise);

        mediaHandler.doDelete(req, res, next);

        findMediaPromise.finally(() => {
            //expect file + 2 variations to be deleted
            expect(unlinkAsync.calls.count()).toBe(3);
            expect(unlinkAsync.calls.argsFor(0)).toEqual([ '/my-media/logo.png' ]);
            expect(unlinkAsync.calls.argsFor(1)).toEqual([ '/my-media/logo.thumb.png' ]);
            expect(unlinkAsync.calls.argsFor(2)).toEqual([ '/my-media/logo.large.png' ]);

            process.nextTick(() => {
                expect(res.status).toHaveBeenCalledWith(204);
                expect(res.send).toHaveBeenCalled();
                done();
            });
        });
    });

    it('updates a media item', (done) => {

        const writeFileAsync = jasmine.createSpy('writeFileAsync');
        mediaHandler.__set__('writeFileAsync', writeFileAsync);

        req.url = '/_media/logo.png';
        req.path = '/_media/logo.png';
        req.body.content = 'Testing 123';

        const mediaModel =  require('../fixtures/media-logo.json');
        const findMediaPromise = Promise.resolve(mediaModel);
        query.exec.and.returnValue(findMediaPromise);

        mediaHandler.doPut(req, res, next);

        findMediaPromise.finally(() => {
            process.nextTick(() => {
                expect(writeFileAsync).toHaveBeenCalledWith('logo.png', req.body.content);
                expect(res.send).toHaveBeenCalled();
                done();
            });
        });
    });
});