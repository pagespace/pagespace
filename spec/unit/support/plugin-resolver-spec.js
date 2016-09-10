'use strict';
const
    bunyan = require('bunyan'),
    createPluginResolver = require('../../../src/support/plugin-resolver');

const pluginResolver = createPluginResolver({
    logger: bunyan.createLogger({
        name: 'pluginresolver',
        streams: []
    })
});

describe('Plugin Resolver', () => {

    it('requires a plugin module', () => {
        const module = pluginResolver.require('pagespace-webcopy');

        expect(module.viewPartial).toBeDefined();
        expect(module.__dir).toBeDefined();
        expect(module.name).toBe('pagespace-webcopy');
        expect(module.config).toBeDefined();
    });
});