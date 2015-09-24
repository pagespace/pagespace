/**
 * Copyright © 2015, Philip Mander
 *
 * This file is part of Pagespace.
 *
 * Pagespace is free software: you can redistribute it and/or modify
 * it under the terms of the Lesser GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Pagespace is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * Lesser GNU General Public License for more details.

 * You should have received a copy of the Lesser GNU General Public License
 * along with Pagespace.  If not, see <http://www.gnu.org/licenses/>.
 */

'use strict';

var fs = require('fs'),
    util = require('util'),
    send = require('send'),
    Promise = require('bluebird'),
    MongooseError = require('mongoose/lib/error'),
    formidable = require('formidable'),
    sizeOf = require('image-size'),
    consts = require('../app-constants'),
    psUtil = require('../support/pagespace-util');

var sizeOfAsync = Promise.promisify(sizeOf);

var MediaHandler = function() {
};

module.exports = new MediaHandler();

MediaHandler.prototype.init = function(support) {

    this.logger = support.logger;
    this.dbSupport = support.dbSupport;
    this.mediaDir = support.mediaDir;
    this.reqCount = 0;

    var self = this;
    return function(req, res, next) {
        return self.doRequest(req, res, next);
    };
};

/**
 * Process a valid request
 */
MediaHandler.prototype.doRequest = function(req, res, next) {

    var logger = psUtil.getRequestLogger(this.logger, req, 'media', ++this.reqCount);

    if(req.method === 'POST') {
        logger.info('New media upload request');
        return this.doUploadResource(req, res, next, logger);
    } else if(req.method === 'GET') {
        logger.debug('New media serve request');
        return this.doServeResource(req, res, next, logger);
    } else if(req.method === 'PUT') {
        logger.info('New media update request');
        return this.doUpdateResource(req, res, next, logger);
    } else {
        var err = new Error('Unsupported method');
        err.status = 405;
        return next(err);
    }
};

MediaHandler.prototype.doServeResource = function(req, res, next, logger) {

    var apiInfo = consts.requests.MEDIA.regex.exec(req.url);
    var itemFileName = apiInfo[1];
    var Media = this.dbSupport.getModel('Media');
    Media.findOne({
        fileName: itemFileName
    }).exec(function(err, model) {
        if(err) {
            logger.warn(err, 'Unable to serve media');
            return next(err);
        }
        if(model && model.path) {
            var stream = send(req, model.path);

            // forward non-404 errors
            stream.on('error', function error(err) {
                logger.warn('Error streaming media for %s (%s)', req.url, model.path);
                next(err.status === 404 ? null : err);
            });

            // pipe
            logger.debug('Streaming media to client for  %s', model.path);
            stream.pipe(res);
        }
    });
};

MediaHandler.prototype.doUpdateResource = function(req, res, next, logger) {



    var apiInfo = consts.requests.MEDIA.regex.exec(req.url);
    var itemFileName = apiInfo[1];
    logger.info('Updating media text for %s', itemFileName);
    var Media = this.dbSupport.getModel('Media');
    Media.findOne({
        fileName: itemFileName
    }).exec(function(err, model) {
        if(err) {
            logger.warn(err, 'Unable to find media item to update');
            return next(err);
        }
        logger.info('Updating file %s', model.path);
        var content = req.body.content;
        fs.writeFile(model.path, content, function(err) {
            if(err) {
                logger.error(err, 'Could not write file to %s', model.path);
                next(err);
            } else {
                logger.info('Update media text OK');
                res.send('%s updated successfully', itemFileName);
            }
        });
    });

};

MediaHandler.prototype.doUploadResource = function(req, res, next, logger) {

    var self = this;

    if(!this.mediaDir) {
        logger.error('Cannot upload media. No upload directory was specified.');
        var e = new Error('Unable to upload media');
        return next(e);
    }
    logger.info('Uploading new media item');

    var form = new formidable.IncomingForm();
    form.uploadDir = this.mediaDir;
    form.keepExtensions = true;
    form.type = 'multipart';

    var formParseAsync = Promise.promisify(form.parse, form);
    formParseAsync(req).catch(function(err) {
        logger.error(err, 'Error uploading media item');
        throw err;
    }).spread(function(fields, files) {
        var dimensions =  files.file.type.indexOf('image') === 0 ? sizeOfAsync(files.file.path) : {};
        logger.debug('Dimensions of %s are w:%s, h:%s', files.file.path, dimensions.width, dimensions.height);
        return Promise.settle([ fields,  files, dimensions ]);
    }).then(function(promises) {
        var fields = promises[0].value();
        var files = promises[1].value();
        var dimensionsPromise = promises[2];

        var dimensions;
        if(dimensionsPromise.isRejected()) {
            logger.warn('Unable to determine image dimensions for %s', files.file.path);
            dimensions = Promise.resolve({});
        } else {
            dimensions = dimensionsPromise.value();
        }
        return [ fields, files, dimensions ];
    }).spread(function(fields, files, dimensions) {
        var tags = fields.tags ? JSON.parse(fields.tags) : [];

        var Media = self.dbSupport.getModel('Media');
        var media = new Media({
            name: fields.name,
            description: fields.description || '',
            tags: tags,
            type: files.file.type,
            path: files.file.path,
            fileName: files.file.name,
            size: files.file.size,
            width: dimensions.width || null,
            height: dimensions.height || null
        });

        var saveAsync = Promise.promisify(media.save, media);
        return Promise.settle([saveAsync(), files.file.path]);
    }).then(function(result) {
        var savePromise = result[0];
        var filePath = result[1].value();
        if(savePromise.isFulfilled()) {
            var model = savePromise.value();
            logger.info('Media upload request OK');
            //don't send file paths to client
            delete model.filePath;
            res.json(model);
        } else {
            //rollback file upload
            fs.unlink(filePath, function(fileErr) {
                if(fileErr) {
                    logger.warn(fileErr, 'Unable to rollback file upload after mongoose save failure');
                } else {
                    logger.debug('Roll back file upload after mongoose save failure was successful');
                }
            })
            //next catch will handle the mongoose failure
            return savePromise.value();
        }
    }).catch(function(err) {
        logger.error(err);
        next(err);
    });
};