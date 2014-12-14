'use strict';

//support
var bunyan = require('bunyan');
var serveStatic = require('serve-static');

//util
var consts = require('../app-constants');
var logLevel = require('../misc/log-level');
var logger =  bunyan.createLogger({ name: 'admin-handler' });
logger.level(logLevel().get());

var AdminHandler = function() {
    this.staticServe = serveStatic(__dirname + '/../../admin-app', { index: false });
};

module.exports = function() {
    return new AdminHandler();
};

AdminHandler.prototype._doRequest = function(req, res, next) {
    logger.info('Processing admin request for %s', req.url);

    var apiInfo = consts.requestMeta.ADMIN.regex.exec(req.url);
    var adminType = apiInfo[1];

    var pageData = {
        appRoot: '/_admin',
        role: req.user.role,
        username: req.user.username
    };

    if(adminType === 'dashboard') {
        return res.render(adminType, pageData, function(err, html) {
            if(err) {
                logger.error(err, 'Trying to render admin page, %s', req.url);
                next(err);
            } else {
                logger.info('Sending page for %s', req.url);
                res.send(html);
            }
        });
    } else {
        req.url = '/' + adminType;
        this.staticServe(req, res, function(e) {
            req.url = req.originalUrl;
            next(e);
        });
    }
};