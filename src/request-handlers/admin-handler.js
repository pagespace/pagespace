"use strict";

//support
var bunyan = require('bunyan');
var util = require('../misc/util');

//util
var consts = require('../app-constants');
var logger =  bunyan.createLogger({ name: 'admin-handler' });
logger.level(GLOBAL.logLevel);

var AdminHandler = function() {
};

module.exports = function() {
    return new AdminHandler();
};

AdminHandler.prototype.doRequest = function(req, res, next) {
    logger.info('Processing admin request for ' + req.url);

    //TODO: power mode always on
    req.query._power = true;

    //check for power mode
    if(req.query._power) {
        if(req.user && req.user.role === 'admin' && util.typeify(req.query._power) === true) {
            logger.debug("Switching power mode on");
            req.session.power = true;
        } else if(util.typeify(req.query._power) === false) {
            logger.debug("Switching power mode off");
            req.session.power = false;
        }
    }

    var apiInfo = consts.requestMeta.ADMIN.regex.exec(req.url);
    var adminType = apiInfo[1];

    var pageData = {
        appRoot: '/_admin',
        powerMode: (req.session.power || false).toString()
    };
    return res.render(adminType, pageData, function(err, html) {
        if(err) {
            logger.error(err, 'Trying to render admin page, %s', req.url);
            next(err);
        } else {
            logger.info('Sending page for %s', req.url);
            res.send(html);
        }
    });
};