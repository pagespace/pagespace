"use strict";

//support
var bunyan = require('bunyan');
var BluebirdPromise = require('bluebird');

//models
var Page = require('../models/page');

//util
var consts = require('../app-constants');
var logger =  bunyan.createLogger({ name: 'publishing-handler' });
logger.level(GLOBAL.logLevel);

var PublishingHandler = function(parts) {
    this.parts = parts;
};

module.exports = function(parts) {
    return new PublishingHandler(parts);
};

/**
 * Process a valid request
 */
PublishingHandler.prototype.doRequest = function(req, res, next) {


};