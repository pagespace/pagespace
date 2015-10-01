var httpSupport = require('./support/http-support');

var TOTAL_PAGES = 18;

var doGets = httpSupport.doGets;
var doGet = httpSupport.doGet;
var doPost = httpSupport.doPost;
var doPut = httpSupport.doPut;
var doDel = httpSupport.doDel;

describe('Client sending API requests for pages', function() {

    // -- get collection

    it('gets pages as admin or editor', function(done) {
        doGets({
            user: [ 'admin', 'editor' ],
            url: '/_api/pages',
            status: 200
        }).then(function(results) {
            results.forEach(function(res) {
                expect(res.body.length).toBe(TOTAL_PAGES);
            });
            done();
        }).catch(function(err) {
            done.fail(err);
        })
    });

    it('does not get pages as guest', function(done) {
        doGet({
            user: 'guest',
            url: '/_api/pages',
            status: 401
        }).then(function() {
            done();
        }).catch(function(err) {
            done.fail(err);
        })
    });

    // -- get one

    it('gets a single page as an editor or admin', function(done) {
        //tests against a known id in the fixture db
        doGets({
            user: ['editor', 'admin'],
            url: '/_api/pages/56044a6199d5e6354d960b29',
            status: 200
        }).then(function(results) {
            results.forEach(function(res) {
                var page = res.body;
                expect(page.name).toBe('Page 4');
                expect(page.url).toBe('/page-4');
                expect(page.root).toBe('top');
                expect(page.regions.length).toBe(3);
                expect(page.template.name).toBe('Template A');
            });
            done();
        }).catch(function(err) {
            done.fail(err);
        })
    });

    it('does not get a single page as guest', function(done) {
        //tests against a known id in the fixture db
        doGet({
            user: 'guest',
            url: '/_api/pages/56044a6199d5e6354d960b29',
            status: 401
        }).then(function() {
            done();
        }).catch(function(err) {
            done.fail(err);
        })
    });

    // -- create a page

    it('creates a page', function(done) {
        var pageBody = require('./fixtures/new-page.json');
        doPost({
            user: 'editor',
            url: '/_api/pages',
            status: 201,
            body: pageBody
        }).then(function(res) {

            //we get back the page created
            var page = res.body;
            expect(page.root).toBe('top');
            expect(page.name).toBe('Page 6');
            expect(page.url).toBe('/page-6');
            expect(page.order).toBe(5);

            return doGets({
                user: 'editor',
                url: '/_api/pages',
                status: 200
            });
        }).then(function(results) {
            results.forEach(function(res) {
                expect(res.body.length).toBe(TOTAL_PAGES + 1);
            });
            done();
        }).catch(function(err) {
            done.fail(err);
        })
    });

    it('does not creates a page with missing data', function(done) {
        var pageBody = require('./fixtures/new-page.json');
        delete pageBody.name;
        doPost({
            user: 'editor',
            url: '/_api/pages',
            status: 400,
            body: pageBody
        }).then(function() {
            done();
        }).catch(function(err) {
            done.fail(err);
        })
    });

    // -- updates a page

    it('updates a page', function(done) {
        var pageBody = {
            name: 'Page Four',
            url: '/page/four'
        };
        doPut({
            user: 'editor',
            url: '/_api/pages/56044a6199d5e6354d960b29',
            status: 200,
            body: pageBody
        }).then(function(res) {
            //we get back the page created
            var page = res.body;
            expect(page.root).toBe('top');
            expect(page.name).toBe('Page Four');
            expect(page.url).toBe('/page/four');
            done();
        }).catch(function(err) {
            done.fail(err);
        })
    });

    it('cannot update a page without an id', function(done) {
        var pageBody = {
            name: 'Page X',
            url: '/page-x'
        };
        doPut({
            user: 'editor',
            url: '/_api/pages',
            status: 400,
            body: pageBody
        }).then(function() {
            done();
        }).catch(function(err) {
            done.fail(err);
        })
    });

    it('cannot update a page with an invalid id', function(done) {
        var pageBody = {
            name: 'Page X',
            url: '/page-x'
        };
        doPut({
            user: 'editor',
            url: '/_api/pages/youcantuseme',
            status: 400,
            body: pageBody
        }).then(function() {
            done();
        }).catch(function(err) {
            done.fail(err);
        })
    });

    // -- delete a page

    it('deletes a page', function(done) {
        doDel({
            user: 'editor',
            url: '/_api/pages/56044a6199d5e6354d960b29',
            status: 204
        }).then(function() {
            done();
        }).catch(function(err) {
            done.fail(err);
        })
    });

    it('cannot delete a page without an id', function(done) {
        doDel({
            user: 'editor',
            url: '/_api/pages',
            status: 400
        }).then(function() {
            done();
        }).catch(function(err) {
            done.fail(err);
        })
    });

    it('cannot delete a page with an invalid id', function(done) {
        doDel({
            user: 'editor',
            url: '/_api/pages/youcantuseme',
            status: 400
        }).then(function() {
            done();
        }).catch(function(err) {
            done.fail(err);
        })
    });
});

