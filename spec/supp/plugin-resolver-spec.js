var bunyan = require('bunyan');
var createPluginResolver = require('../../src/support/plugin-resolver');

var pluginResolver = createPluginResolver({
    logger: bunyan.createLogger({
        name: 'pluginresolver',
        streams: []
    })
});

describe('Plugin Resolver', function() {

    it('requires a plugin module', function() {

        var module = pluginResolver.require('pagespace-webcopy');

        expect(module.__viewPartial).toBeDefined();
        expect(module.__dir).toBeDefined();
        expect(module.__config.name).toBe('pagespace-webcopy');
        expect(module.__config.pagespace.name).toBe('Web Copy');
        expect(module.__config.pagespace.config).toBeDefined();
    });
});