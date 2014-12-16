'use strict';

//support
var bunyan = require('bunyan');

//util
var logLevel = require('../misc/log-level');
var logger =  bunyan.createLogger({ name: 'dashboard-handler' });
logger.level(logLevel().get());

var DashboardHandler = function() {
};

module.exports = function() {
    return new DashboardHandler();
};

DashboardHandler.prototype._doRequest = function(req, res, next) {
    logger.info('Processing admin request for %s', req.url);

    var pageData = {
        role: req.user.role,
        username: req.user.username
    };

    return res.render('dashboard', pageData, function(err, html) {
        if(err) {
            logger.error(err, 'Error trying to render dashboard page, %s', req.url);
            next(err);
        } else {
            logger.info('Sending page for %s', req.url);
            res.send(html);
        }
    });
};