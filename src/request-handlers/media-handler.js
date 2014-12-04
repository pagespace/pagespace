"use strict";

//support
var bunyan = require('bunyan');
var Bluebird = require('bluebird');

//util
var formidable = require('formidable'),
    http = require('http'),
    util = require('util');

var logger =  bunyan.createLogger({ name: 'publishing-handler' });
logger.level(GLOBAL.logLevel);

var PublishingHandler = function(dbSupport, mediaDir) {
    this.dbSupport = dbSupport;
    this.mediaDir = mediaDir
};

module.exports = function(dbSupport, mediaDir) {
    return new PublishingHandler(dbSupport, mediaDir);
};

/**
 * Process a valid request
 */
PublishingHandler.prototype.doRequest = function(req, res, next) {

    if(req.method === 'POST') {
        return this.upload(req, res, next);
    } else if(req.method === 'GET') {
        return this.serve(req, res, next);
    } else {
        var err = new Error('Unsupported method');
        err.status = 405;
        throw err;
    }
};

PublishingHandler.prototype.serve = function(req, res, next) {

};

PublishingHandler.prototype.upload = function(req, res, next) {

    var self = this;

    var form = new formidable.IncomingForm();

    form.uploadDir = this.mediaDir;
    form.keepExtensions = true;
    form.type = 'multipart';

    try {
        form.parse(req, function(err, fields, files) {
            logger.info(util.inspect({fields: fields, files: files}));

            var tags = [];
            if(fields.tags) {
                tags = fields.tags.split(",").map(function(tag) {
                    return tag.trim();
                });
            }

            var Media = self.dbSupport.getModel('Media');
            var media = new Media({
                name: fields.name,
                description: fields.description,
                tags: tags,
                type: files.file.type,
                path: files.file.path,
                fileName: files.file.name,
                size: files.size
            });
            media.save(function (err, model) {
                if (err) {
                    logger.error(err, 'Trying to save for media item for %s', fields);
                    next(err);
                } else {
                    logger.info('Created successfully');
                    delete model.filePath;
                    res.json(model);
                }
            });
        });
    } catch(e) {
        next(e);
    }
};