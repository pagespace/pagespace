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

    send = require('send'),
    formidable = require('formidable'),

    consts = require('../app-constants'),
    psUtil = require('../misc/pagespace-util');


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
        return this._upload(req, res, next, logger);
    } else if(req.method === 'GET') {
        logger.debug('New media serve request');
        return this._serve(req, res, next, logger);
    } else if(req.method === 'PUT') {
        logger.info('New media update request');
        return this._update(req, res, next, logger);
    } else {
        var err = new Error('Unsupported method');
        err.status = 405;
        return next(err);
    }
};

MediaHandler.prototype._serve = function(req, res, next, logger) {

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

MediaHandler.prototype._update = function(req, res, next, logger) {



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

MediaHandler.prototype._upload = function(req, res, next, logger) {

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

    try {
        //save media
        form.parse(req, function(err, fields, files) {
            logger.info('Media item saved to: %s', files.file.path);
            var tags = fields.tags ? JSON.parse(fields.tags) : [];

            var Media = self.dbSupport.getModel('Media');
            var media = new Media({
                name: fields.name,
                description: fields.description || '',
                tags: tags,
                type: files.file.type,
                path: files.file.path,
                fileName: files.file.name,
                size: files.file.size
            });

            media.save(function (err, model) {
                if (err) {
                    logger.error(err, 'Trying to save for media item for to db for %s', fields);
                    next(err);
                } else {
                    logger.info('Media upload request OK');
                    //don't send file paths to client
                    delete model.filePath;
                    res.json(model);
                }
            });
        });
    } catch(err) {
        logger.error(err, 'Error uploading media item');
        return next(e);
    }
};