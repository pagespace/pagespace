'use strict';
const
    Promise = require('bluebird'),
    createSpies = require('../helpers/spies'),
    apiHandler = require('../../../src/middleware/api-handler');

describe('API Handler', () => {

    let spies, req, res, next, dbSupport, logger, query, Model;
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

        apiHandler.init({
            logger: logger,
            dbSupport: dbSupport
        });
    });

    describe('gets items and', () => {
        it('gets a collection of items as json', (done) => {
            req.path = '/_api/pages';

            const result =  [{ name : 'foo'}];
            const resultPromise = Promise.resolve(result);
            query.exec.and.returnValue(resultPromise);


            apiHandler.doGet(req, res, next);

            resultPromise.finally(() => {
                expect(Model.find.calls.mostRecent().args[0]).toEqual({});
                expect(res.json).toHaveBeenCalledWith(result);
                done();
            });
        });

        it('gets a single item as json', (done) => {
            req.path = '/_api/pages/123';

            const result =  [{ name : 'foo'}, { name: 'bar'}];
            const resultPromise = Promise.resolve(result);

            query.exec.and.returnValue(resultPromise);
            dbSupport.getModel.and.returnValue(Model);

            apiHandler.doGet(req, res, next);

            resultPromise.finally(() => {
                expect(dbSupport.getModel).toHaveBeenCalledWith('Page');
                expect(Model.find.calls.mostRecent().args[0]).toEqual({ _id: '123'});
                expect(res.json).toHaveBeenCalledWith(result[0]);
                done();
            });
        });

        it('gets a collection of items as html', (done) => {
            req.path = '/_api/pages';
            req.headers.accept = 'text/html';

            const result =  [{ name : 'foo'}, { name: 'bar'}];
            const resultPromise = Promise.resolve(result);
            query.exec.and.returnValue(resultPromise);
            Model.modelName = 'Page';

            apiHandler.doGet(req, res, next);

            resultPromise.finally(() => {
                const expectedTitle = '<title>Page: , all</title>';
                expect(res.send.calls.mostRecent().args[0]).toContain(expectedTitle);
                done();
            });
        });

        it('gets a single item as html', (done) => {
            req.path = '/_api/pages/123';
            req.headers.accept = 'text/html';

            const result =  [{ name : 'foo'}, { name: 'bar'}];
            const resultPromise = Promise.resolve(result);
            query.exec.and.returnValue(resultPromise);
            Model.modelName = 'Page';

            apiHandler.doGet(req, res, next);

            resultPromise.finally(() => {
                const expectedTitle = '<title>Page: foo, 123</title>';
                expect(res.send.calls.mostRecent().args[0]).toContain(expectedTitle);
                done();
            });
        });


        it('handles errors', (done) => {
            req.path = '/_api/pages/123';

            const err = new Error('test error');
            const resultPromise = Promise.reject(err);
            query.exec.and.returnValue(resultPromise);
            Model.modelName = 'Page';

            apiHandler.doGet(req, res, next);
            resultPromise.catch(() => {}).finally(() => {
                expect(next).toHaveBeenCalledWith(err);
                done();
            });
        });

        //pages
        it('gets pages', () => {
            req.path = '/_api/pages';
            query.exec.and.returnValue(Promise.resolve());
            apiHandler.doGet(req, res, next);
            expect(dbSupport.getModel).toHaveBeenCalledWith('Page');
        });
        it('gets a page', () => {
            req.path = '/_api/pages/123';
            query.exec.and.returnValue(Promise.resolve());
            apiHandler.doGet(req, res, next);
            expect(dbSupport.getModel).toHaveBeenCalledWith('Page');
        });

        //templates
        it('gets templates', () => {
            req.path = '/_api/templates';
            query.exec.and.returnValue(Promise.resolve());
            apiHandler.doGet(req, res, next);
            expect(dbSupport.getModel).toHaveBeenCalledWith('Template');
        });
        it('gets a template', () => {
            req.path = '/_api/templates/123';
            query.exec.and.returnValue(Promise.resolve());
            apiHandler.doGet(req, res, next);
            expect(dbSupport.getModel).toHaveBeenCalledWith('Template');
        });

        //media
        it('gets media', () => {
            req.path = '/_api/media';
            query.exec.and.returnValue(Promise.resolve());
            apiHandler.doGet(req, res, next);
            expect(dbSupport.getModel).toHaveBeenCalledWith('Media');
        });
        it('gets a media', () => {
            req.path = '/_api/media/123';
            query.exec.and.returnValue(Promise.resolve());
            apiHandler.doGet(req, res, next);
            expect(dbSupport.getModel).toHaveBeenCalledWith('Media');
        });

        //Include
        it('gets include', () => {
            req.path = '/_api/includes';
            query.exec.and.returnValue(Promise.resolve());
            apiHandler.doGet(req, res, next);
            expect(dbSupport.getModel).toHaveBeenCalledWith('Include');
        });
        it('gets an include', () => {
            req.path = '/_api/includes/123';
            query.exec.and.returnValue(Promise.resolve());
            apiHandler.doGet(req, res, next);
            expect(dbSupport.getModel).toHaveBeenCalledWith('Include');
        });

        //Plugin
        it('gets plugins', () => {
            req.path = '/_api/plugins';
            query.exec.and.returnValue(Promise.resolve());
            apiHandler.doGet(req, res, next);
            expect(dbSupport.getModel).toHaveBeenCalledWith('Plugin');
        });
        it('gets a plugin', () => {
            req.path = '/_api/plugins/123';
            query.exec.and.returnValue(Promise.resolve());
            apiHandler.doGet(req, res, next);
            expect(dbSupport.getModel).toHaveBeenCalledWith('Plugin');
        });

        //User
        it('gets users', () => {
            req.path = '/_api/users';
            query.exec.and.returnValue(Promise.resolve());
            apiHandler.doGet(req, res, next);
            expect(dbSupport.getModel).toHaveBeenCalledWith('User');
        });
        it('gets a user', () => {
            req.path = '/_api/users/123';
            query.exec.and.returnValue(Promise.resolve());
            apiHandler.doGet(req, res, next);
            expect(dbSupport.getModel).toHaveBeenCalledWith('User');
        });

        //Macro
        it('gets macros', () => {
            req.path = '/_api/macros';
            query.exec.and.returnValue(Promise.resolve());
            apiHandler.doGet(req, res, next);
            expect(dbSupport.getModel).toHaveBeenCalledWith('Macro');
        });
        it('gets a macro', () => {
            req.path = '/_api/macros/123';
            query.exec.and.returnValue(Promise.resolve());
            apiHandler.doGet(req, res, next);
            expect(dbSupport.getModel).toHaveBeenCalledWith('Macro');
        });

        it('tests bad urls', () => {
            req.path = '/_api/foo';
            query.exec.and.returnValue(Promise.resolve());
            expect(() => apiHandler.doGet(req, res, next)).toThrow();
        });
    });

    describe('creates items and', () => {
        it('creates an item and sends a response', (done) => {

            req.path = '/_api/pages';
            req.body = {
                name: 'fooy',
                __v: 'xyz',
                _id: '123'
            };


            const model = { name: 'fooy'};
            const resultPromise = Promise.resolve(model);
            Model.prototype.save.and.returnValue(resultPromise);

            apiHandler.doPost(req, res, next);

            expect(Model.prototype._setData.calls.mostRecent().args[0].name).toBe('fooy');
            expect(Model.prototype._setData.calls.mostRecent().args[0]._id).toBeUndefined();
            expect(Model.prototype._setData.calls.mostRecent().args[0].__v).toBeUndefined();

            resultPromise.finally(() => {
                expect(res.status).toHaveBeenCalledWith(201);
                expect(res.json).toHaveBeenCalledWith(model);
                done();
            });
        });

        it('cannot post to urls with ids', () => {
            req.path = '/_api/pages/123';

            apiHandler.doPost(req, res, next);

            expect(next).toHaveBeenCalled();
            expect(next.calls.mostRecent().args[0].status).toBe(400);
        });

        it('handles errors', (done) => {
            req.path = '/_api/pages';
            req.body = {
                name: 'fooy',
                __v: 'xyz',
                _id: '123'
            };

            const err = new Error();
            err.name = 'ValidationError';
            const resultPromise = Promise.reject(err);
            Model.prototype.save.and.returnValue(resultPromise);

            apiHandler.doPost(req, res, next);

            resultPromise.catch(() => {}).finally(() => {
                expect(next).toHaveBeenCalledWith(err);
                expect(next.calls.mostRecent().args[0].status).toBe(400);
                done();
            });
        });
    });

    describe('updates items and', () => {

        it('updates an item and sends a response', (done) => {

            req.path = '/_api/pages/123';
            req.body = {
                name: 'fooy',
                __v: 'xyz',
                _id: '123'
            };

            const model = { name: 'fooy'};
            const resultPromise = Promise.resolve(model);
            query.exec.and.returnValue(resultPromise);

            apiHandler.doPut(req, res, next);

            expect(Model.findOneAndUpdate.calls.mostRecent().args[0]).toEqual({ _id: '123'});
            const doc = Model.findOneAndUpdate.calls.mostRecent().args[1];
            expect(doc._id).toBeUndefined();
            expect(doc.__v).toBeUndefined();
            expect(doc.draft).toBe(true);
            expect(doc.name).toBe('fooy');
            expect(doc.updatedBy).toBe(req.user._id);

            resultPromise.finally(() => {
                expect(res.json).toHaveBeenCalledWith(model);
                done();
            });
        });

        it('cannot update using urls without ids', () => {
            req.path = '/_api/pages';

            apiHandler.doPut(req, res, next);

            expect(next).toHaveBeenCalled();
            expect(next.calls.mostRecent().args[0].status).toBe(400);
        });

        it('handles errors', (done) => {
            req.path = '/_api/pages/123';
            req.body = {
                name: 'fooy',
                __v: 'xyz',
                _id: '123'
            };

            const err = new Error();
            err.name = 'CastError';
            const resultPromise = Promise.reject(err);
            query.exec.and.returnValue(resultPromise);

            apiHandler.doPut(req, res, next);

            resultPromise.catch(() => {}).finally(() => {
                expect(next).toHaveBeenCalledWith(err);
                expect(next.calls.mostRecent().args[0].status).toBe(400);
                done();
            });
        });
    });

    describe('removes items and', () => {

        it('removes an item and sends a response', (done) => {

            req.path = '/_api/pages/123';

            const resultPromise = Promise.resolve();
            query.exec.and.returnValue(resultPromise);

            apiHandler.doDelete(req, res, next);

            expect(Model.findByIdAndRemove.calls.mostRecent().args[0]).toBe('123');

            resultPromise.finally(() => {
                expect(res.status).toHaveBeenCalledWith(204);
                expect(res.send).toHaveBeenCalled();
                done();
            });
        });

        it('cannot remove using urls without ids', () => {
            req.path = '/_api/pages';

            apiHandler.doDelete(req, res, next);

            expect(next).toHaveBeenCalled();
            expect(next.calls.mostRecent().args[0].status).toBe(400);
        });

        it('handles errors', (done) => {
            req.path = '/_api/pages/123';
            const err = new Error();
            err.name = 'CastError';
            const resultPromise = Promise.reject(err);
            query.exec.and.returnValue(resultPromise);

            apiHandler.doDelete(req, res, next);

            resultPromise.catch(() => {}).finally(() => {
                expect(next).toHaveBeenCalledWith(err);
                expect(next.calls.mostRecent().args[0].status).toBe(400);
                done();
            });
        });
    });
});