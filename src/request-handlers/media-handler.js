"use strict";

//support
var bunyan = require('bunyan');
var send = require('send');

//util
var formidable = require('formidable'),
    util = require('util'),
    consts = require('../app-constants');

var logger =  bunyan.createLogger({ name: 'media-handler' });
var logLevel = require('../misc/log-level');
logger.level(logLevel().get());

var MediaHandler = function(dbSupport, mediaDir) {
    this.dbSupport = dbSupport;
    this.mediaDir = mediaDir;
};

module.exports = function(dbSupport, mediaDir) {
    return new MediaHandler(dbSupport, mediaDir);
};

/**
 * Process a valid request
 */
MediaHandler.prototype._doRequest = function(req, res, next) {

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

MediaHandler.prototype.serve = function(req, res, next) {

    var apiInfo = consts.requestMeta.MEDIA.regex.exec(req.url);
    var itemFileName = apiInfo[1];
    var Media = this.dbSupport.getModel('Media');
    Media.findOne({
        fileName: itemFileName
    }).exec(function(err, model) {
        if(err) {
            return next(err);
        }
        if(model && model.path) {
            var stream = send(req, model.path);

            // forward non-404 errors
            stream.on('error', function error(err) {
                next(err.status === 404 ? null : err);
            });

            // pipe
            stream.pipe(res);
        }
    });

};

MediaHandler.prototype.upload = function(req, res, next) {

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
                size: files.file.size
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