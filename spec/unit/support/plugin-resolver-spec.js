var bunyan = require('bunyan');
var createPluginResolver = require('../../../src/support/plugin-resolver');

var pluginResolver = createPluginResolver({
    logger: bunyan.createLogger({
        name: 'pluginresolver',
        streams: []
    })
});

describe('Plugin Resolver', function() {

    it('requires a plugin module', function() {

        var module = pluginResolver.require('pagespace-webcopy');

        expect(module.viewPartial).toBeDefined();
        expect(module.__dir).toBeDefined();
        expect(module.name).toBe('pagespace-webcopy');
        expect(module.config).toBeDefined();
    });
});