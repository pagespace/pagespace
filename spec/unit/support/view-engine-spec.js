const
    path = require('path'),
    fs = require('fs'),
    rewire = require('rewire'),
    viewEngine = rewire('../../../src/support/view-engine');

describe('view engine', () => {

    it('renders a handlebars template', (done) => {

        const readFile = jasmine.createSpy('readFile');
        readFile.and.callFake((filename, enc, cb) => {
            const file = fs.readFileSync(filename, 'utf8');
            cb(null, file);
        });
        viewEngine.__set__('readFile', readFile);

        const templateId = 't1';

        viewEngine().registerPartial('p1', 'wrist watch', templateId);
        viewEngine().registerPartial('p2', 'swiss', templateId);

        viewEngine().setCommonLocals({
            l1: 'Which',
            cache: true
        });

        new Promise((resolve) => {
            const templateFile = path.join(__dirname, '../fixtures/templates/view-engine-test.hbs');
            viewEngine().__express(templateFile, {
                l2: 'is the',
                __template: templateId
            }, (err, result) => {
                expect(result).toEqual('Which wrist watch is the swiss wrist watch?');
                resolve();
            });
        }).then(() => {
            const templateFile = path.join(__dirname, '../fixtures/templates/view-engine-test.hbs');
            viewEngine().__express(templateFile, {
                l2: 'is the',
                __template: templateId
            }, (err, result) => {
                expect(result).toEqual('Which wrist watch is the swiss wrist watch?');

                //thos ensures the cache was used, and readFile was only called once for both renderings
                expect(readFile.calls.count()).toBe(1);
                done();
            });
        });
    });
});