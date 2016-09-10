'use strict';
const
    rewire = require('rewire'),
    Promise = require('bluebird'),
    createSpies = require('../helpers/spies'),
    mediaHandler = rewire('../../../src/middleware/media-handler'),
    fs = require('fs'),
    path = require('path');

describe('Media Handler', () => {

    let spies, req, res, next, dbSupport, logger, query, Model, send, stream, formidable;
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
        formidable = spies.formidable;

        mediaHandler.init({
            logger: logger,
            dbSupport: dbSupport,
            mediaDir: '/my-media',
            imageVariations: [{
                label: 'thumb',
                size: 200
            }, {
                label: 'large',
                size: 1000
            }]
        });
    });

    it('streams a media item', (done) => {

        mediaHandler.__set__('send', send);

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

    const fields = {
        "name_0": "Amsterdam Header",
        "description_0": "undefined",
        "tags_0": "[]",
        "name_1": "Logo",
        "description_1": "undefined",
        "tags_1": "[]",
        "name_2": "Logo",
        "description_2": "undefined",
        "tags_2": "[]"
    };
    const files = {
        "file_0": {
            "size": 181755,
            "path": path.join(__dirname, '../fixtures/upload_e623ec5a5117f5d13214e0682344e791.jpg'),
            "name": "amsterdam-header.jpg",
            "type": "image/jpeg",
        },
        "file_1": {
            "size": 1431,
            "path": path.join(__dirname, '../fixtures/upload_5f92995aa65529acbb731e29140dfee7.html'),
            "name": "logo.html",
            "type": "text/html",
        },
        "file_2": {
            "size": 4608,
            "path": path.join(__dirname, '../fixtures/upload_dc65bcf2796fcced854cce0a908b6591.png'),
            "name": "logo.png",
            "type": "image/png",
        }
    };

    it('creates a new media item (with variations)', (done) => {

        const writeFileAsync = jasmine.createSpy('writeFileAsync');
        mediaHandler.__set__('writeFileAsync', writeFileAsync);
        mediaHandler.__set__('formidable', formidable);

        req.path = '/_media';
        req.method = 'POST';
        delete req.body.__v;
        delete req.body;

        formidable.IncomingForm.prototype.parse.and.callFake((req, cb) => {
            cb(null, fields, files);
        });

        const model = { name: 'upload'};
        const resultPromise = Promise.resolve(model);
        Model.prototype.save.and.returnValue(resultPromise);

        res.json.and.callFake((models) => {
            expect(res.status).toHaveBeenCalledWith(201);
            //2 x 2 resize variations should be written to disk
            expect(writeFileAsync.calls.count()).toBe(4);
            expect(writeFileAsync).toHaveBeenCalledWith(jasmine.stringMatching('fixtures/upload_e623ec5a5117f5d13214e0682344e791.thumb.jpg'), jasmine.anything());
            expect(writeFileAsync).toHaveBeenCalledWith(jasmine.stringMatching('fixtures/upload_dc65bcf2796fcced854cce0a908b6591.thumb.png'), jasmine.anything());
            expect(writeFileAsync).toHaveBeenCalledWith(jasmine.stringMatching('fixtures/upload_e623ec5a5117f5d13214e0682344e791.large.jpg'), jasmine.anything());
            expect(writeFileAsync).toHaveBeenCalledWith(jasmine.stringMatching('fixtures/upload_dc65bcf2796fcced854cce0a908b6591.large.png'), jasmine.anything());

            expect(models).toEqual([{ name: 'upload' }, { name: 'upload' }, { name: 'upload' }])
            done();
        });

        mediaHandler.doPost(req, res, next);
    });

    it('rolls back new files created when the db transaction fails', (done) => {

        const writeFileAsync = jasmine.createSpy('writeFileAsync');
        const unlinkAsync = jasmine.createSpy('writeFileAsync');
        mediaHandler.__set__('writeFileAsync', writeFileAsync);
        mediaHandler.__set__('unlinkAsync', unlinkAsync);
        mediaHandler.__set__('formidable', formidable);

        req.path = '/_media';
        req.method = 'POST';
        delete req.body.__v;
        delete req.body;

        formidable.IncomingForm.prototype.parse.and.callFake((req, cb) => {
            cb(null, fields, files);
        });

        const resultPromise = Promise.reject(new Error('db failed'));
        Model.prototype.save.and.returnValue(resultPromise);

        next.and.callFake((err) => {
            //2 x 2 resize variations should be written to disk
            expect(writeFileAsync.calls.count()).toBe(4);
            //3 files + (2 x 2) variations
            expect(unlinkAsync.calls.count()).toBe(7);
            expect(err.status).toBe(400);
            done();
        });

        mediaHandler.doPost(req, res, next);
    });
});