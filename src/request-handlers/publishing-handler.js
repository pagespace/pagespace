"use strict";

//support
var bunyan = require('bunyan');
var BluebirdPromise = require('bluebird');

//models
var Page = require('../models/page');

//util
var util = require('../misc/util');
var logger =  bunyan.createLogger({ name: 'publishing-handler' });
logger.level(GLOBAL.logLevel);

var PublishingHandler = function() {

};

module.exports = function(parts) {
    return new PublishingHandler(parts);
};

/**
 * Process a valid request
 */
PublishingHandler.prototype.doRequest = function(req, res, next) {

    if(req.method === 'GET') {
        return this.getDrafts(req, res, next);
    }
};

PublishingHandler.prototype.getDrafts = function(req, res, next) {

    var filter = {
        draft: true
    };

    var query = Page.find(filter).populate('regions.part, template');
    var findDraftPages = BluebirdPromise.promisify(query.exec, query);
    findDraftPages().then(function(pages) {
        if(req.headers.accept.indexOf('application/json') === -1) {
            var html = util.htmlStringify(pages);
            res.send(html, {
                'Content-Type' : 'text/html'
            }, 200);
        } else {
            res.json(pages);
        }
    }).catch(function(e) {
        next(new Error(e));
    });
};