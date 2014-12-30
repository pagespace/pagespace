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
 * along with Foobar.  If not, see <http://www.gnu.org/licenses/>.
 */

'use strict';

//support
var send = require('send');

//util
var formidable = require('formidable'),
    util = require('util'),
    consts = require('../app-constants');

var MediaHandler = function(support) {
    this.dbSupport = support.dbSupport;
    this.mediaDir = support.mediaDir;
    this.logger = support.logger.child({module: 'media-handler'});
};

module.exports = function(support) {
    return new MediaHandler(support);
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
        return next(err);
    }
};

MediaHandler.prototype.serve = function(req, res, next) {

    var logger = this.logger;

    logger.info('Serving media for %s', req.url);

    var apiInfo = consts.requests.MEDIA.regex.exec(req.url);
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
                logger.warning('Error streaming media for %s (%s)', req.url, model.path);
                next(err.status === 404 ? null : err);
            });

            // pipe
            logger.info('Streaming media to client for  %s', model.path);
            stream.pipe(res);
        }
    });

};

MediaHandler.prototype.upload = function(req, res, next) {

    var self = this;
    var logger = this.logger;

    if(!this.mediaDir) {
        logger.error('Cannot upload media. No upload directory was specified.')
        var e = new Error('Unable to upload media');
        return next(e);
    }

    var form = new formidable.IncomingForm();
    form.uploadDir = this.mediaDir;
    form.keepExtensions = true;
    form.type = 'multipart';

    try {
        form.parse(req, function(err, fields, files) {
            logger.info(util.inspect({fields: fields, files: files}));

            var tags = [];
            if(fields.tags) {
                tags = fields.tags.split(',').map(function(tag) {
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
                    //don't send file paths to client
                    delete model.filePath;
                    res.json(model);
                }
            });
        });
    } catch(e) {
        return next(e);
    }
};