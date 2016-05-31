'use strict';

//deps
const 
    url = require('url'),
    BaseHandler = require('./base-handler');


class DashboardHandler extends BaseHandler {
    
    get pattern() {
        return new RegExp('^/_dashboard/?(inpage|settings)?');
    }
    
    init(support) {
        this.logger = support.logger;
        this.viewEngine = support.viewEngine;
        this.userBasePath = support.userBasePath;
        this.dbSupport = support.dbSupport;
        this.pluginResolver = support.pluginResolver;
        this.imageVariations = support.imageVariations;
    }

    doGet(req, res, next) {
        const logger = this.getRequestLogger(this.logger, req);

        logger.info('New dashboard request from %s', req.user.username);

        const pageData = {
            username: req.user.username,
            displayName: req.user.name,
            allowUsers: req.user.role === 'admin',
            allowTemplatesAndPlugins: req.user.role === 'developer' || req.user.role === 'admin',
            year: new Date().toISOString().substr(0, 4)
        };

        const urlPath = url.parse(req.url).pathname;
        const reqInfo = this.pattern.exec(urlPath);
        const reqType = reqInfo[1];

        if(reqType === 'settings') {
            return res.json({
                imageVariations: this.imageVariations
            });
        } else {
            const view = reqType === 'inpage' ? 'inpage.hbs' : 'dashboard.hbs';
            return res.render(view, pageData, (err, html) => {
                if(err) {
                    logger.error(err, 'Error trying to render dashboard page, %s', req.url);
                    next(err);
                } else {
                    logger.info('Dashboard request OK');
                    res.send(html);
                }
            });
        }

    }
}

module.exports = new DashboardHandler();