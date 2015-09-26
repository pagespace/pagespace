var createAcl = require('../../src/support/acl').acl;

var GET = 'GET';
var POST = 'POST';
var PUT = 'PUT';
var DELETE = 'DELETE';
var ALL_ACTIONS = [ GET, POST, PUT, DELETE ];

var editor = 'editor';
var guest = 'guest';
var admin = 'admin';
//role, resourec ,action

describe('ACL', function() {

    it('manages access', function() {
        var acl = createAcl();

        //all everything
        acl.match(/.*/, ALL_ACTIONS).thenOnlyAllow([ editor, admin, guest]);

        expect(acl.isAllowed(editor, '/foo', GET)).toBe(true);
        expect(acl.isAllowed(editor, '/foo', POST)).toBe(true);
        expect(acl.isAllowed(editor, '/foo', PUT)).toBe(true);
        expect(acl.isAllowed(editor, '/foo', DELETE)).toBe(true);

        expect(acl.isAllowed(admin, '/foo', GET)).toBe(true);
        expect(acl.isAllowed(admin, '/foo', POST)).toBe(true);
        expect(acl.isAllowed(admin, '/foo', PUT)).toBe(true);
        expect(acl.isAllowed(admin, '/foo', DELETE)).toBe(true);

        expect(acl.isAllowed(guest, '/foo', GET)).toBe(true);
        expect(acl.isAllowed(guest, '/foo', POST)).toBe(true);
        expect(acl.isAllowed(guest, '/foo', PUT)).toBe(true);
        expect(acl.isAllowed(guest, '/foo', DELETE)).toBe(true);

        //restrict guest
        acl.match(/.*/, ALL_ACTIONS).thenOnlyAllow([ editor, admin]);

        expect(acl.isAllowed(editor, '/foo', GET)).toBe(true);
        expect(acl.isAllowed(editor, '/foo', POST)).toBe(true);
        expect(acl.isAllowed(editor, '/foo', PUT)).toBe(true);
        expect(acl.isAllowed(editor, '/foo', DELETE)).toBe(true);

        expect(acl.isAllowed(admin, '/foo', GET)).toBe(true);
        expect(acl.isAllowed(admin, '/foo', POST)).toBe(true);
        expect(acl.isAllowed(admin, '/foo', PUT)).toBe(true);
        expect(acl.isAllowed(admin, '/foo', DELETE)).toBe(true);

        expect(acl.isAllowed(guest, '/foo', GET)).toBe(false);
        expect(acl.isAllowed(guest, '/foo', POST)).toBe(false);
        expect(acl.isAllowed(guest, '/foo', PUT)).toBe(false);
        expect(acl.isAllowed(guest, '/foo', DELETE)).toBe(false);

        //prevent editor from deleting
        acl.match(/.*/, [ DELETE ]).thenOnlyAllow([ admin ]);

        expect(acl.isAllowed(editor, '/foo', GET)).toBe(true);
        expect(acl.isAllowed(editor, '/foo', POST)).toBe(true);
        expect(acl.isAllowed(editor, '/foo', PUT)).toBe(true);
        expect(acl.isAllowed(editor, '/foo', DELETE)).toBe(false);

        expect(acl.isAllowed(admin, '/foo', GET)).toBe(true);
        expect(acl.isAllowed(admin, '/foo', POST)).toBe(true);
        expect(acl.isAllowed(admin, '/foo', PUT)).toBe(true);
        expect(acl.isAllowed(admin, '/foo', DELETE)).toBe(true);

        expect(acl.isAllowed(guest, '/foo', GET)).toBe(false);
        expect(acl.isAllowed(guest, '/foo', POST)).toBe(false);
        expect(acl.isAllowed(guest, '/foo', PUT)).toBe(false);
        expect(acl.isAllowed(guest, '/foo', DELETE)).toBe(false);

        //prevent editor from accessing /foo/bar
        acl.match(/^\/foo\/bar$/, ALL_ACTIONS).thenOnlyAllow([ admin, guest ]);

        expect(acl.isAllowed(editor, '/foo/bar', GET)).toBe(false);
        expect(acl.isAllowed(editor, '/foo/bar', POST)).toBe(false);
        expect(acl.isAllowed(editor, '/foo/bar', PUT)).toBe(false);
        expect(acl.isAllowed(editor, '/foo/bar', DELETE)).toBe(false);

        expect(acl.isAllowed(admin, '/foo/bar', GET)).toBe(true);
        expect(acl.isAllowed(admin, '/foo/bar', POST)).toBe(true);
        expect(acl.isAllowed(admin, '/foo/bar', PUT)).toBe(true);
        expect(acl.isAllowed(admin, '/foo/bar', DELETE)).toBe(true);

        expect(acl.isAllowed(guest, '/foo/bar', GET)).toBe(true);
        expect(acl.isAllowed(guest, '/foo/bar', POST)).toBe(true);
        expect(acl.isAllowed(guest, '/foo/bar', PUT)).toBe(true);
        expect(acl.isAllowed(guest, '/foo/bar', DELETE)).toBe(true);
    });
});