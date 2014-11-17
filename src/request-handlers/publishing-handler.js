"use strict";

//support
var bunyan = require('bunyan');
var BluebirdPromise = require('bluebird');

//models
var pageSchema = require('../schemas/page');

//util
var modelFactory = require('./../misc/model-factory')();
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

    if(req.method === 'POST') {
        return this.publishDrafts(req, res, next);
    } else {
        var err = new Error('Unsupported method');
        err.status = 405;
        throw err;
    }
};

PublishingHandler.prototype.publishDrafts = function(req, res, next) {

    var draftIds = req.body;

    res.statusCode = 204;
    res.send();
/*
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
    });*/
};