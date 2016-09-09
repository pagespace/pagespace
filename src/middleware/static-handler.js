'use strict';

//deps
const
    serveStatic = require('serve-static'),
    BaseHandler = require('./base-handler');

class StaticHandler extends BaseHandler {
    get pattern() {
        return new RegExp('^/_static/?(dashboard|inpage|plugins|sample|bower_components)/?([A-z0-9-_\.]*)/?(.*)');
    }

    init(support) {
        this.logger = support.logger;
        this.pluginResolver = support.pluginResolver;
        this.adminStaticServer = serveStatic(__dirname + '/../../static', {
            index: false
        });
        this.pluginStaticServers = {};
    }

    doGet(req, res, next) {
        const logger = this.getRequestLogger(this.logger, req);
    
        logger.trace(`Processing static request for ${req.url}`);

        const apiInfo = this.pattern.exec(req.path);
        const staticType = apiInfo[1];
        let staticPath;
        if(staticType !== 'plugins') {
            staticPath = apiInfo[2] + (apiInfo[3] ? `/${apiInfo[3]}` : '');
            req.url = `/${staticType}/${staticPath}`;
            this.adminStaticServer(req, res, (err) => {
                req.status = 404;
                req.url = req.originalUrl;
                next(err);
            });
        } else {
            const pluginModuleId = apiInfo[2];
            staticPath = apiInfo[3];
            if(!this.pluginStaticServers[pluginModuleId]) {
                const pluginModule = this.pluginResolver.require(pluginModuleId);
                if(!pluginModule) {
                    const err = new Error(`Cannot resolve plugin module for ${pluginModuleId}`);
                    err.url = req.url;
                    err.status = 404;
                    return next();
                }
                this.pluginStaticServers[pluginModuleId] = serveStatic(pluginModule.__dir, {
                    index: false
                });
            }
            req.url = `/static/${staticPath}`;
            this.pluginStaticServers[pluginModuleId](req, res, (err) => {
                req.url = req.originalUrl;
                next(err);
            });
        }
    }
}

module.exports = new StaticHandler();
