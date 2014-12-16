'use strict';

//support
var bunyan = require('bunyan');
var serveStatic = require('serve-static');

//util
var consts = require('../app-constants');
var logLevel = require('../misc/log-level');
var logger =  bunyan.createLogger({ name: 'static-handler' });
logger.level(logLevel().get());

var StaticHandler = function() {
    this.adminStaticServe = serveStatic(__dirname + '/../../admin', { index: false });
};

module.exports = function() {
    return new StaticHandler();
};

StaticHandler.prototype._doRequest = function(req, res, next) {
    logger.info('Processing static request for %s', req.url);

    var apiInfo = consts.requestMeta.STATIC.regex.exec(req.url);
    var staticType = apiInfo[1];
    var staticPath = apiInfo[2];

    req.url = '/' + staticType + '/' + staticPath;
    this.adminStaticServe(req, res, function(e) {
        req.url = req.originalUrl;
        next(e);
    });

};