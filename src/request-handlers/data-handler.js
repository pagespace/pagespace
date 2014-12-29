'use strict';

//support
var BluebirdPromise = require('bluebird');

//util
var consts = require('../app-constants');

var DataHandler = function(support) {

    this.logger = support.logger.child({module: 'data-handler'});
    this.parts = support.parts;
    this.dbSupport = support.dbSupport;
};

module.exports = function(support) {
    return new DataHandler(support);
};

/**
 * Process a valid request
 */
DataHandler.prototype._doRequest = function(req, res, next) {

    var self = this;
    var logger = this.logger;
    //TODO: logging

    var dataInfo = consts.requests.DATA.regex.exec(req.url);
    var pageId = dataInfo[1];
    var regionId = dataInfo[2];

    //clear props not to overwrite
    delete req.body._id;
    delete req.body.__v;

    var filter = {
        _id: pageId
    };

    var Page = this.dbSupport.getModel('Page');
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
            partPromise = partModule.read(region.data);
        } else if(req.method === 'PUT') {
            partPromise = partModule.update(region.data, req.body);
        } else if(req.method === 'DELETE') {
            partPromise = partModule.delete(region.data, req.body);
        } else {
            var err = new Error('Unsupported method');
            err.status = 405;
            throw err;
        }
        return [ page, region, partPromise ];
    }).spread(function(page, region, partData) {
        if(req.method === 'PUT' || req.method === 'DELETE') {
            region.data = partData;
            page.draft = true;
            page.save(function (err) {
                if (err) {
                    throw err;
                }
                res.statusCode = 204;
                res.send();
            });
        } else {
            res.json(partData);
        }
    }).catch(function(err) {
        return next(new Error(err));
    });

};