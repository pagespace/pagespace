'use strict';

//support
var serveStatic = require('serve-static');

//util
var consts = require('../app-constants');

var StaticHandler = function(support) {
    this.logger = support.logger.child({module: 'static-handler'});
    this.adminStaticServe = serveStatic(__dirname + '/../../admin', { index: false });
};

module.exports = function(support) {
    return new StaticHandler(support);
};

StaticHandler.prototype._doRequest = function(req, res, next) {

    var logger = this.logger;

    logger.info('Processing static request for %s', req.url);

    var apiInfo = consts.requests.STATIC.regex.exec(req.url);
    var staticType = apiInfo[1];
    var staticPath = apiInfo[2];

    req.url = '/' + staticType + '/' + staticPath;
    this.adminStaticServe(req, res, function(e) {
        req.url = req.originalUrl;
        next(e);
    });

};