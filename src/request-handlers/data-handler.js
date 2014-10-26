"use strict";

//support
var bunyan = require('bunyan');
var hbs = require('hbs');

//models
var Page = require('../models/page');
var Part = require('../models/part');

//util
var util = require('../misc/util');
var logger =  bunyan.createLogger({ name: 'data-handler' });
logger.level('debug');

var DataHandler = function(parts) {
    this.parts = parts;
};

module.exports = function(parts) {
    return new DataHandler(parts);
};

/**
 * Process a valid request
 */
DataHandler.prototype.doRequest = function(req, res, next) {

    var self = this;

    var dataInfo = consts.requestRegex.API.exec(req.url);
    var pageId = dataInfo[1];
    var regionId = dataInfo[2];

    //clear props not to overwrite
    delete req.body._id;
    delete req.body.__v;

    var filter = {
        _id: pageId
    };

    function findRegion(callback) {
        Page.find(filter).populate('regions.part').exec(function(err, results) {
            if(err) {
                logger.error(err, 'Trying to do page GET for %s', pageId);
                return next(err);
            } else {
                //get data for region
                var region = page.regions.filter(function(region) {
                    return region.region == regionId;
                })[0];
                callback(null, region);
            }
        });
    }

    var partPromise;
    findRegion(function(region) {

        var partModule = self.parts[region.part];

        if(req.method === 'GET') {
            partPromise = partModule.read(req.body, data);
        } else if(req.method === 'PUT') {
            partPromise = partModule.update(req.body, data);
        } else if(req.method === 'DELETE') {
            partPromise = partModule.delete(req.body, data);
        } else {
            var err = new Error('Unsupported method');
            err.status = 405;
            return next(err);
        }

        partPromise.then(function(data) {
            if(req.method === 'PUT' || req.method === 'DELETE') {
                region.data = data;
                Page.save(function (err) {
                    if (err) {
                        return next(err);
                    }
                    res.statusCode = 204;
                    return res.send();
                });
            } else {
                return res.json(data);
            }
        });
        partPromise.catch(function(err) {
            return next(new Error(err));
        });
    });
};