"use strict";

//support
var bunyan = require('bunyan');
var hbs = require('hbs');
var BluebirdPromise = require('bluebird');

//models
var Page = require('../models/page');
var Part = require('../models/part');

//util
var util = require('../misc/util');
var consts = require('../app-constants');
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

    var dataInfo = consts.requestRegex.DATA.exec(req.url);
    var pageId = dataInfo[1];
    var regionId = dataInfo[2];

    //clear props not to overwrite
    delete req.body._id;
    delete req.body.__v;

    var filter = {
        _id: pageId
    };

    //
   /* Page.find(filter).populate('regions.part').exec(function(err, page) {
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
    });*/

    var query = Page.findOne(filter).populate('regions.part');
    var findPage = BluebirdPromise.promisify(query.exec, query);
    findPage().then(function(page) {
        //get data for region
        var region = page.regions.filter(function(region) {
            return region.name === regionId;
        })[0];

        var partPromise = null;
        var partModule = self.parts[region.part._id];

        if(req.method === 'GET') {
            partPromise = partModule.read(req.body);
        } else if(req.method === 'PUT') {
            partPromise = partModule.update(req.body);
        } else if(req.method === 'DELETE') {
            partPromise = partModule.delete(req.body);
        } else {
            var err = new Error('Unsupported method');
            err.status = 405;
            throw err;
        }
        return [ page, region, partPromise ];
    }).spread(function(page, region, partData) {
        if(req.method === 'PUT' || req.method === 'DELETE') {
            region.data = partData;
            page.save(function (err) {
                if (err) {
                    throw err;
                }
                res.statusCode = 204;
                res.send();
            });
        } else {
            res.json(data);
        }
    }).catch(function(err) {
        return next(new Error(err));
    });

};