/**
 * Copyright © 2015, Versatile Internet
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
    path = require('path'),
    send = require('send'),
    Promise = require('bluebird'),
    formidable = require('formidable'),
    sizeOf = require('image-size'),
    lwip = require('lwip'),
    consts = require('../app-constants'),
    psUtil = require('../support/pagespace-util');

var writeFileAsync = Promise.promisify(fs.writeFile);
var unlinkAsync = Promise.promisify(fs.unlink);
var sizeOfAsync = Promise.promisify(sizeOf);
Promise.promisifyAll(require('lwip/lib/Image').prototype);

var MediaHandler = function() {
};

module.exports = new MediaHandler();

MediaHandler.prototype.init = function(support) {

    this.logger = support.logger;
    this.dbSupport = support.dbSupport;
    this.mediaDir = support.mediaDir;
    this.imageSizes = support.imageSizes || [];
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
        //catch upload errors immediately
        logger.error(err, 'Error uploading media item');
        throw err;
    }).spread(function(fields, files) {
        //get image dimensions
        var dimensions =  files.file.type.indexOf('image') === 0 ? sizeOfAsync(files.file.path) : {};
        logger.debug('Dimensions of %s are w:%s, h:%s', files.file.path, dimensions.width, dimensions.height);
        return Promise.settle([ fields,  files, dimensions ]);
    }).then(function(promises) {
        //step to handle unknown image dimensions
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
        //generate thumbnail image
        var thumb = self.imageSizes.filter(function(imageSize) {
            return imageSize.label && imageSize.label === 'thumb' && (imageSize.width || imageSize.height);
        })[0];
        var thumbnailPromise = thumb && dimensions.width && dimensions.height ?
            resizeImage(files.file.path, 'thumb', dimensions, { width: thumb.width, height: thumb.height}) : null;

        return [ fields, files, dimensions, thumbnailPromise ];
    }).spread(function(fields, files, dimensions, thumbnail) {
        //save media to db
        var tags = fields.tags ? JSON.parse(fields.tags) : [];

        var Media = self.dbSupport.getModel('Media');

        var variations = [];
        if(thumbnail) {
            variations.push(thumbnail);
        }

        var media = new Media({
            name: fields.name,
            description: fields.description || '',
            tags: tags,
            type: files.file.type,
            path: files.file.path,
            fileName: files.file.name,
            size: files.file.size,
            width: dimensions.width || null,
            height: dimensions.height || null,
            variations: variations
        });

        var saveAsync = Promise.promisify(media.save, media);
        return Promise.settle([ saveAsync(), files.file.path, thumbnail ]);
    }).then(function(result) {
        //send response
        var savePromise = result[0];
        if(savePromise.isFulfilled()) {
            var model = savePromise.value();
            //don't send local path to client
            delete model.filePath;
            res.status(201);
            res.json(model);
        } else {
            var filePath = result[1].value();
            var thumbnailPath = result[2] && result[2].path;
            var err = savePromise.reason();
            err.fileUploadPath = filePath;
            err.thumnailPath = thumbnailPath;
            //next catch will handle the mongoose failure
            throw err;
        }
    }).catch(function(err) {
        //rollback upload
        logger.error(err);

        if(err.code && err.code === 11000) {
            err.message = 'This file has already been uploaded';
            err.status = 400;
        }
        var rollbackPromises = [];
        rollbackPromises.push(err);
        if(err.fileUploadPath) {
            //rollback file upload
            rollbackPromises.push(unlinkAsync(err.fileUploadPath));
        }
        if(err.thumnailPath) {
            //rollback thumbnail creation
            rollbackPromises.push(unlinkAsync(err.thumnailPath));
        }
        return rollbackPromises;
    }).all(function(rollbackResults) {
        //successfull rollback
        logger.debug('Roll back file upload after mongoose save failure was successful');
        next(rollbackResults[0]);
    }).catch(function(err) {
        //rollback error
        logger.warn(err, 'Unable to rollback file modifications after mongoose save failure');
        next(err);
    });
};

function resizeImage(filePatb, label, fDim, tDim, logger) {

    var toPath = path.parse(filePatb);
    toPath.name = toPath.name + '.' + label;
    var format = toPath.ext.substr(1);

    var newSize = 0;
    var ratio = fDim.height / fDim.width;

    //calc width
    if(!tDim.width || tDim.width === 'auto') {
        tDim.width = tDim.height * ratio;
        tDim.width = fDim.width > fDim.height ? fDim.height / ratio : fDim.height * ratio;
    }

    //calc height
    if(!tDim.height || tDim.height === 'auto') {
        tDim.height = fDim.height > fDim.width ? fDim.height / ratio : fDim.height * ratio;
    }

    return lwip.openAsync(function(image) {
        logger.debug('Resizing image @ %s to %s x %s', filePatb, tDim.width, tDim.height);
        return image.resizeAsync(tDim.width, tDim.height);
    }).then(function(image) {
        logger.debug('Resize OK. Saving image as %s', format);
        return image.toBufferAsync(format);
    }).then(function(buffer) {
        newSize = buffer.length;
        return writeFileAsync(path.format(toPath), buffer);
    }).then(function() {
        logger.debug('New image save to %s', toPath);
        return {
            label: label,
            path: toPath,
            size: newSize,
            width: tDim.width,
            height: tDim.height,
            type: 'image/' + format
        };
    });
}