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

//deps
const 
    fs = require('fs'),
    url = require('url'),
    path = require('path'),
    send = require('send'),
    Promise = require('bluebird'),
    formidable = require('formidable'),
    sizeOf = require('image-size'),
    BaseHandler = require('./base-handler');

const 
    writeFileAsync = Promise.promisify(fs.writeFile),
    unlinkAsync = Promise.promisify(fs.unlink),
    sizeOfAsync = Promise.promisify(sizeOf);

let sharp;
try {
    sharp = require('sharp');
} catch(err) {
    sharp = null;
}

class MediaHandler extends BaseHandler {
    
    get pattern() {
        return new RegExp('^/_media/?(.*)');
    }
    
    init(support) {
    
        this.logger = support.logger;
        this.dbSupport = support.dbSupport;
        this.mediaDir = support.mediaDir;
        this.imageVariations = support.imageVariations;
    }

    doGet(req, res, next) {
    
        const logger = this.getRequestLogger(this.logger, req);
    
        const urlPath = url.parse(req.url).pathname;
        const apiInfo = this.pattern.exec(urlPath);
        const itemFileName = decodeURIComponent(apiInfo[1]);
        const mediaDir = this.mediaDir;
        const Media = this.dbSupport.getModel('Media');
        Media.findOne({
            fileName: itemFileName
        }).exec((err, model) => {
            if(err) {
                logger.warn(err, 'Unable to serve media');
                return next(err);
            }
    
            if(model) {
                let mediaPath = null;
    
                //find the variation path for this label
                if(req.query.label) {
                    const variation = model.variations.find((variation) => variation.label === req.query.label.trim());
                    if(variation) {
                        mediaPath = path.isAbsolute(variation.path) ?  variation.path : path.join(mediaDir, variation.path);
                    }
                }
    
                //revert to original if there is no variation
                mediaPath = mediaPath || (path.isAbsolute(model.path) ? model.path : path.join(mediaDir, model.path));
    
                const stream = send(req, mediaPath);
    
                // forward non-404 errors
                stream.on('error', (err) => {
                    logger.warn('Error streaming media for %s (%s)', req.url, mediaPath);
                    next(err.status === 404 ? null : err);
                });
    
                // pipe
                logger.debug('Streaming media to client for  %s', mediaPath);
                stream.pipe(res);
            } else {
                err = new Error(itemFileName + ' not found');
                err.status = 404;
                return next(err);
            }
        });
    }

    doPut(req, res, next) {
    
        const logger = this.getRequestLogger(this.logger, req);
    
        const urlPath = url.parse(req.url).pathname;
        const apiInfo = this.pattern.exec(urlPath);
        const itemFileName = apiInfo[1];
        logger.info('Updating media text for %s', itemFileName);
        const Media = this.dbSupport.getModel('Media');
        Media.findOne({ fileName: itemFileName }).then((model) => {
            logger.info('Updating file %s', model.path);
            const content = req.body.content;
            fs.writeFile(model.path, content, (err) => {
                if(err) {
                    logger.error(err, 'Could not write file to %s', model.path);
                    next(err);
                } else {
                    logger.info('Update media text OK');
                    res.send('%s updated successfully', itemFileName);
                }
            });
        }).then(undefined, (err) => {
            logger.warn(err, 'Unable to find media item to update');
            return next(err);
        });
    }

    doPost(req, res, next) {

        const logger = this.getRequestLogger(this.logger, req);
    
        if(!this.mediaDir) {
            logger.error('Cannot upload media. No upload directory was specified.');
            const e = new Error('Unable to upload media');
            return next(e);
        }
        logger.info('Uploading new media item');
    
        const form = new formidable.IncomingForm();
        form.uploadDir = this.mediaDir;
        form.keepExtensions = true;
        form.type = 'multipart';
    
        const formParseAsync = Promise.promisify(form.parse, { context: form, multiArgs: true });
        formParseAsync(req).catch((err) => {
            //catch upload errors immediately
            logger.error(err, 'Error uploading media item');
            throw err;
        }).spread((fields, files) => {
            //get image dimensions
            const dimensions =  files.file.type.startsWith('image') ? sizeOfAsync(files.file.path) : {};
            logger.debug('Dimensions of %s are w:%s, h:%s', files.file.path, dimensions.width, dimensions.height);
    
            return Promise.all([ fields,  files, dimensions ].map((promise) => {
                return (promise instanceof Promise ? promise : Promise.resolve(promise)).reflect();
            }));
        }).then((promises) => {
            //step to handle unknown image dimensions
            const fields = promises[0].value();
            const files = promises[1].value();
            const dimensionsPromise = promises[2];
    
            let dimensions;
            if(dimensionsPromise.isRejected()) {
                logger.warn('Unable to determine image dimensions for %s', files.file.path);
                dimensions = Promise.resolve({});
            } else {
                dimensions = dimensionsPromise.value();
            }
            return [ fields, files, dimensions ];
        }).spread((fields, files, dimensions) => {
            //generate image constiations
            let variationPromises = [];
            const file = files.file;
            if(file.type.indexOf('image') === 0 && dimensions.width && dimensions.height) {
                variationPromises = this.imageVariations.map((variation) => {
                    return resizeImage(file.path, variation.label, dimensions, variation.size, variation.format, logger);
                });
            }
            return [ fields, files, dimensions ].concat(variationPromises);
        }).spread((fields, files, dimensions) => {
            //save media to db
            const tags = fields.tags ? JSON.parse(fields.tags) : [];
    
            const Media = this.dbSupport.getModel('Media');
    
            const variations = [].slice.call(arguments, 3); //extra args are the possible image variations
    
            const media = new Media({
                name: fields.name,
                description: fields.description || '',
                tags: tags,
                type: files.file.type,
                path: files.file.path,
                fileName: path.basename(files.file.name), //save path relative to media dir
                size: files.file.size,
                width: dimensions.width || null,
                height: dimensions.height || null,
                variations: variations.map((variation) => {
                    //save paths relative to media dir
                    const updatedVariation = JSON.parse(JSON.stringify(variation)); //until Object.assign is native
                    updatedVariation.path = path.basename(variation.path);
                    return updatedVariation;
                })
            });
    
            const saveAsync = Promise.promisify(media.save, { context: media });
            return Promise.all([ saveAsync(), files.file ].concat(variations).map((promise) => {
                return (promise instanceof Promise ? promise : Promise.resolve(promise)).reflect();
            }));
        }).then((result) => {
            //send response
            const savePromise = result[0];
            if(savePromise.isFulfilled()) {
                //success
                const model = savePromise.value();
                res.status(201);
                res.json(model);
            } else {
                //failure
                //collect new files to rollback (remove)
                const newUploadPaths = result.slice(1).map((pathResult) => {
                    return pathResult.value().path;
                });
                const err = savePromise.reason();
                err.paths = newUploadPaths;
                //next catch will handle the mongoose failure
                throw err;
            }
        }).catch((err) => {
            //rollback upload
            logger.error(err);
    
            if(err.code && err.code === 11000) {
                err.message = 'This file has already been uploaded';
                err.status = 400;
            }
            const rollbackPromises = err.paths.map((path) => {
                logger.debug(`Rolling back file upload after mongoose save failure (${path})`);
                return unlinkAsync(path);
            });
            Promise.all(rollbackPromises).then(() => {
                //successful rollback
                logger.debug('Roll back file upload after mongoose save failure was successful');
                next(err);
            }).catch((err) => {
                logger.warn(err, 'Unable to rollback file modifications after mongoose save failure');
                next(err);
            });
        });
    }
}

module.exports = new MediaHandler();

function resizeImage(filePath, label, fromDim, toDim, format, logger) {

    if(!sharp) {
        logger.warn('Sharp is not installed, image variations will not be created');
        return Promise.resolve();
    }

    const dir = path.dirname(filePath);
    const ext = path.extname(filePath);
    const base = path.basename(filePath);
    const newBase = base.substring(0, base.length - ext.length) + '.' + label;
    format = format || ext.substr(1);
    if(format === 'jpg') {
        format = 'jpeg';
    }

    const fileName =  newBase + '.' + format;
    const toPath = path.join(dir, fileName);

    let newSize = 0;
    const ratio = fromDim.width / fromDim.height;

    let toWidth, toHeight;
    if(typeof toDim === 'number') {
        if(fromDim.width > fromDim.height) {
            toWidth = toDim;
            toHeight = toDim / ratio;
        } else {
            toHeight = toDim;
            toWidth = toDim * ratio;
        }
    } else if(typeof toDim.width === 'number' && typeof toDim.height === 'number') {
        toWidth = toDim.width;
        toHeight = toDim.height;
    } else {
        throw new Error('Cannot resize image for %s without a width or height', label);
    }

    const image = sharp(filePath);
    return image.metadata().then(() => {
        return image.resize(parseInt(toWidth, 10), parseInt(toHeight, 10)).toFormat(format).toBuffer();
    }).then((buffer) => {
        logger.debug('Resize OK. Saving image as %s', format);
        newSize = buffer.length;
        return writeFileAsync(toPath, buffer);
    }).then(() => {
        logger.debug('New image save to %s', toPath);
        return {
            label: label,
            path: toPath,
            size: newSize,
            width: Math.round(toWidth),
            height: Math.round(toHeight)
        };
    });
}