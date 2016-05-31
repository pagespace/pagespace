'use strict';

const vm = require('vm'),
    fs = require('fs'),
    path = require('path'),
    resolve = require('resolve'),
    consts = require('../app-constants');

let instance = null;

class PluginResolver {

    constructor(opts) {
        this.logger = opts.logger;
        this.dbSupport = opts.dbSupport;
        this.userBasePath = opts.userBasePath;
        this.requireCache = {};        
    }
    
    require(pluginModuleId) {

        const logger = this.logger;

        if(!pluginModuleId) {
            return null;
        }
        let pluginModule = this.requireCache[pluginModuleId];
        if(!pluginModule) {
            try {
                const pluginPath = resolve.sync(pluginModuleId, {
                    basedir: this.userBasePath
                });

                const pluginDirPath = path.dirname(pluginPath);

                const pluginConfig = this._getPluginConfig(pluginDirPath);

                const code = fs.readFileSync(pluginPath, 'utf8');
                const sandbox = {
                    console : console,
                    module  : {},
                    __filename: pluginPath,
                    __dirname: pluginDirPath,
                    Buffer: Buffer,
                    setTimeout: setTimeout,
                    setInterval: setInterval,
                    Promise: Promise || require('bluebird'),
                    require : (modulePath) => {
                        const resolvedPath = resolve.sync(modulePath, {
                            basedir: pluginDirPath
                        });

                        try {
                            return require(resolvedPath);
                        } catch(err){
                            logger.error(err, 'Module unable to use require');
                        }
                    },
                    pagespace: {
                        getModel: (name, previewMode) => {
                            return this.dbSupport.getModel(name, previewMode ? '' : 'live');
                        },
                        getPageModel: (previewMode) => {
                            return this.dbSupport.getModel('Page', previewMode ? '' : 'live');
                        },
                        pluginResolver: this,
                        logger: logger.child({plugin: pluginModuleId}),
                        userBasePath: this.userBasePath
                    }
                };

                vm.runInNewContext(code, sandbox, {
                    filename: pluginPath
                });

                pluginModule = sandbox.module.exports;
                Object.assign(pluginModule, pluginConfig);
                this.requireCache[pluginModuleId] = pluginModule;
            } catch(err) {
                console.log(err);
                logger.warn(err, 'The plugin module %s could not be resolved', pluginModuleId);
            }
        }
        return pluginModule;
    }

    _getPluginConfig(pluginDirPath) {

        const pluginConf = {};

        const logger = this.logger;

        pluginConf.__dir = pluginDirPath;

        const pluginConfigPath = path.join(pluginDirPath, 'package.json');
        try {
            const packageConf = require(pluginConfigPath);
            pluginConf.name = packageConf.name;
            pluginConf.description = packageConf.description;
            pluginConf.config =  packageConf.pagespace || {};
            pluginConf.config.ttl = pluginConf.config.ttl || consts.DEFAULT_PLUGIN_CACHE_TTL;
        } catch(err) {
            logger.warn('Couldn\'t load plugin config at %s', pluginDirPath);
        }

        //load the plugin view
        const pluginViewPath = path.join(pluginDirPath, 'index.hbs');
        logger.debug('Loading plugin view partial from %s...', pluginViewPath);
        try {
            pluginConf.viewPartial = fs.readFileSync(pluginViewPath, 'utf8');
        } catch(err) {
            logger.warn('Cannot find an index template (index.hbs) for the plugin module for [%s]', pluginDirPath);
        }

        return pluginConf;
    }
}

module.exports = (opts) => {

    if(!instance) {
        instance = new PluginResolver(opts);
    }

    return instance;
};
