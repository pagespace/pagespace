var httpSupport = require('./support/http-support');

var TOTAL_TEMPLATES = 2;

var doGet = httpSupport.doGet;
var doGets = httpSupport.doGets;
var doPost = httpSupport.doPost;
var doPut = httpSupport.doPut;
var doDel = httpSupport.doDel;

describe('Client sending API requests for templates', function() {

    it('gets templates as editor admin', function(done) {
        doGets({
            user: [ 'admin', 'editor' ],
            url: '/_api/templates',
            status: 200
        }).then(function(results) {
            results.forEach(function(res) {
                expect(res.body.length).toBe(TOTAL_TEMPLATES);
            });
            done();
        }).catch(function(err) {
            done.fail(err);
        })
    });

    it('does not get templates as guest', function(done) {
        doGet({
            user: 'guest',
            url: '/_api/templates',
            status: 401
        }).then(function() {
            done();
        }).catch(function(err) {
            done.fail(err);
        })
    });

    it('gets a single templates as editor admin', function(done) {
        //tests against a known id in the fixture db
        doGets({
            user: ['editor', 'admin'],
            url: '/_api/templates/5604446c99d5e6354d960b0f',
            status: 200
        }).then(function(results) {
            results.forEach(function(res) {
                var template = res.body;
                expect(template.name).toBe('Template A');
                expect(template.regions[0].name).toBe('Sidebar');
                expect(template.regions[1].name).toBe('Main');
                expect(template.regions[2].name).toBe('Footer');
                expect(template.src).toBe('standard.hbs');
            });
            done();
        }).catch(function(err) {
            done.fail(err);
        });
    });

    it('does not get a single page as guest', function(done) {
        //tests against a known id in the fixture db
        doGet({
            user: 'guest',
            url: '/_api/templates/5604446c99d5e6354d960b0f',
            status: 401
        }).then(function() {
            done();
        }).catch(function(err) {
            done.fail(err);
        });
    });

    it('creates a template', function(done) {
        var body = require('./fixtures/new-template.json');
        doPost({
            user: 'admin',
            url: '/_api/templates',
            status: 201,
            body: body
        }).then(function(res) {

            //we get back the page created
            var template = res.body;
            expect(template.name).toBe('Template C');
            expect(template.regions[0].name).toBe('Sidebar');
            expect(template.regions[1].name).toBe('Main');
            expect(template.regions[2].name).toBe('Footer');
            expect(template.src).toBe('standard.hbs');

            return doGets({
                user: 'editor',
                url: '/_api/templates',
                status: 200
            });
        }).then(function(results) {
            results.forEach(function(res) {
                expect(res.body.length).toBe(TOTAL_TEMPLATES + 1);
            });
            done();
        }).catch(function(err) {
            done.fail(err);
        })
    });

    it('does not creates a page with missing data', function(done) {
        var body = require('./fixtures/new-template.json');
        delete body.name;
        doPost({
            user: 'admin',
            url: '/_api/templates',
            status: 400,
            body: body
        }).then(function() {
            done();
        }).catch(function(err) {
            done.fail(err);
        })
    });

    xit('updates a template', function(done) {
        var body = {
            name: 'Template X',
            src: 'standard-x.hbs'
        };
        doPut({
            user: 'admin',
            url: '/_api/templates/5604446c99d5e6354d960b0f',
            status: 200,
            body: body
        }).then(function(res) {
            //we get back the page created
            var template = res.body;
            expect(template.name).toBe('Template X');
            expect(template.regions[0].name).toBe('Sidebar');
            expect(template.regions[1].name).toBe('Main');
            expect(template.regions[2].name).toBe('Footer');
            expect(template.src).toBe('standard-x.hbs');
            done();
        }).catch(function(err) {
            done.fail(err);
        })
    });

    xit('deletes a template', function(done) {
        doDel({
            user: 'admin',
            url: '/_api/templates/5604446c99d5e6354d960b0f',
            status: 204
        }).then(function() {
            done();
        }).catch(function(err) {
            done.fail(err);
        })
    });
});

