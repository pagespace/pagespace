var Promise = require('bluebird'),
    fs = require('fs'),
    app = require('../../app.js').app,
    pagespace = require('../../app.js').pagespace,
    httpSupport = require('./support/http-support');

var doGet = httpSupport.doGet;
var doGets = httpSupport.doGets;
var doPost = httpSupport.doPost;

describe('Client sending media requests', function() {

    it('cannot upload media as guest', function(done) {

        doPost({
            user: 'guest',
            url: '/_media',
            fields: [
                {
                    name: 'name',
                    value: 'Pagespace Logo'
                }
            ],
            attach: {
                name: 'file',
                value: __dirname + '/fixtures/media/avatar.png'
            },
            status: 401
        }).then(function() {
            done();
        }).catch(function(err) {
            done.fail(err);
        })
    });

    it('can upload media as editor', function(done) {

        var uploads = fs.readdirSync(__dirname + '/../../media-uploads');
        var images =  uploads.filter(function(file) {
            return /upload_(.+)\.png/.test(file);
        });
        expect(images.length).toBe(0);

        doPost({
            user: 'editor',
            url: '/_media',
            fields: [
                {
                    name: 'name',
                    value: 'Pagespace Avatar'
                },
                {
                    name: 'description',
                    value: 'Pagespace logo'
                },
                {
                    name: 'tags',
                    value: '[{"text":"pagespace"},{"text":"logo"}]'
                }
            ],
            attach: {
                name: 'file',
                value: __dirname + '/fixtures/media/avatar.png'
            },
            status: 201
        }).then(function(res) {
            var item = res.body[0];

            expect(item.fileName).toBe('avatar.png');
            expect(item.name).toBe('Pagespace Avatar');
            expect(item.description).toBe('Pagespace logo');
            expect(item.tags).toEqual([{"text":"pagespace"},{"text":"logo"}]);
            expect(item.width).toBe(128);
            expect(item.height).toBe(128);
            expect(item.size).toBe(6993);
            expect(item.type).toBe('image/png');

            var uploads = fs.readdirSync(__dirname + '/../../media-uploads');
            var images =  uploads.filter(function(file) {
                return /upload_(.+)\.png/.test(file);
            });
            expect(images.length).toBe(1);

            done();
        }).catch(function(err) {
            done.fail(err);
        })
    });

    it('can upload an media as admin', function(done) {

        var uploads = fs.readdirSync(__dirname + '/../../media-uploads');
        var docs =  uploads.filter(function(file) {
            return /upload_(.+)\.png/.test(file);
        });
        expect(docs.length).toBe(1);

        doPost({
            user: 'editor',
            url: '/_media',
            fields: [
                {
                    name: 'name',
                    value: 'Important Doc'
                },
                {
                    name: 'tags',
                    value: '[{"text":"docs"}]'
                }
            ],
            attach: {
                name: 'file',
                value: __dirname + '/fixtures/media/pagespace.pdf'
            },
            status: 201
        }).then(function(res) {
            var item = res.body[0];

            expect(item.fileName).toBe('pagespace.pdf');
            expect(item.name).toBe('Important Doc');
            expect(item.description).toBe('');
            expect(item.tags).toEqual([{"text":"docs"}]);
            expect(item.width).toBe(null);
            expect(item.height).toBe(null);
            expect(item.size).toBe(117626);
            expect(item.type).toBe('application/pdf');

            var uploads = fs.readdirSync(__dirname + '/../../media-uploads');
            var docs =  uploads.filter(function(file) {
                return /upload_(.+)\.pdf/.test(file);
            });
            expect(docs.length).toBe(1);

            done();
        }).catch(function(err) {
            done.fail(err);
        })
    });

    it('cannot upload the same file name twice', function(done) {

        var uploads = fs.readdirSync(__dirname + '/../../media-uploads');
        expect(uploads.length).toBe(2);

        doPost({
            user: 'editor',
            url: '/_media',
            fields: [
                {
                    name: 'name',
                    value: 'Avatar 2'
                }
            ],
            attach: {
                name: 'file',
                value: __dirname + '/fixtures/media/avatar.png'
            },
            status: 400
        }).then(function() {

            //ensures the rollback occurred
            var uploads = fs.readdirSync(__dirname + '/../../media-uploads');
            expect(uploads.length).toBe(2);

            done();
        }).catch(function(err) {
            done.fail(err);
        })
    });

    it('can get static media assets as any role', function(done) {

        var p1 = doGets({
            user: [ 'guest', 'editor', 'admin' ],
            url: '/_media/avatar.png',
            status: 200
        });

        var p2 = doGets({
            user: [ 'guest', 'editor', 'admin' ],
            url: '/_media/pagespace.pdf',
            status: 200
        });

        Promise.all([ p1, p2 ]).then(function() {
            done();
        }).catch(function(err) {
            done.fail(err);
        });
    });
});