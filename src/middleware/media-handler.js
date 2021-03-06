'use strict';

//deps
const 
    fs = require('fs'),
    path = require('path'),
    Promise = require('bluebird'),
    BaseHandler = require('./base-handler');
let send = require('send'),
    formidable = require('formidable');

//allows pagespace to gracefully fail if Sharp is not working
try {
    var sharp = require('sharp');
} catch(err) {
    //swallow. pagespace already warns on startup and we will warn later if an image upload is attempted
}

let writeFileAsync = Promise.promisify(fs.writeFile),
    unlinkAsync = Promise.promisify(fs.unlink);

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

        const apiInfo = this.pattern.exec(req.path);
        const itemFileName = decodeURIComponent(apiInfo[1]);
        const mediaDir = this.mediaDir;
        const Media = this.dbSupport.getModel('Media');
        Media.findOne({
            fileName: itemFileName
        }).exec().then((model) => {
            if(!model) {
                const err = new Error(`${itemFileName} not found`);
                err.status = 404;
                throw err;
            }

            let mediaPath = null;

            //find the variation path for this label
            if(req.query.label) {
                const variation = model.variations.find((variation) => variation.label === req.query.label.trim());
                if(variation) {
                    mediaPath = this._getVariationPath(model.path, variation);
                }
            }

            //revert to original if there is no variation
            mediaPath = mediaPath || (path.isAbsolute(model.path) ? model.path : path.join(mediaDir, model.path));

            const stream = send(req, mediaPath);

            // forward non-404 errors
            stream.on('error', (err) => {
                logger.warn(`Error streaming media for ${req.url} (${mediaPath})`);
                next(err.status === 404 ? null : err);
            });

            // pipe
            logger.debug(`Streaming media to client for ${mediaPath}`);
            stream.pipe(res);

        }).catch(err => {
            logger.debug(err, 'Unable to serve media');
            return next(err);
        });
    }

    doDelete(req, res, next) {
        
        const logger = this.getRequestLogger(this.logger, req);

        const apiInfo = this.pattern.exec(req.path);
        const itemFileName = decodeURIComponent(apiInfo[1]);
        const mediaDir = this.mediaDir;
        const Media = this.dbSupport.getModel('Media');

        Media.findOneAndRemove({
            fileName: itemFileName
        }).exec().then((model) => {
            //get base
            const basePath = path.isAbsolute(model.path) ? model.path : path.join(mediaDir, model.path);
            //get variations
            const paths = [basePath].concat(model.variations.map((variation) => {
                return this._getVariationPath(basePath, variation);
            }));
            //unlink
            const unlinkPromises = paths.map((filePath) => {
                return unlinkAsync(filePath);
            });
            return Promise.all(unlinkPromises);
        }).then(() => {
            res.status(204);
            res.send();
        }).catch(err => {
            logger.error(err, `Couldn't delete media files`);
            next(err);
        });
    }

    doPut(req, res, next) {
    
        const logger = this.getRequestLogger(this.logger, req);

        const apiInfo = this.pattern.exec(req.path);
        const itemFileName = apiInfo[1];

        const content = req.body.content;

        if(!content) {
            const msg = `No content provided to update ${itemFileName}`;
            const err = new Error(msg);
            err.status = 400;
            logger.warn(msg);
            return next(err);
        }

        logger.info('Updating media text for %s', itemFileName);
        const Media = this.dbSupport.getModel('Media');
        Media.findOne({ fileName: itemFileName }).exec().catch(err => {
            logger.warn(err, 'Unable to find media item to update');
            next(err);
        }).then((model) => {
            logger.info('Updating file %s', model.path);
            return writeFileAsync(model.path, content);
        }).then(() => {
            logger.info('Update media text OK');
            res.send('%s updated successfully', itemFileName);
        }).catch(err => {
            logger.error(err, 'Could not write file');
            next(err);
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
        form.multiples = true;

        const formParseAsync = Promise.promisify(form.parse, { context: form, multiArgs: true });
        formParseAsync(req).catch((err) => {
            //catch upload errors immediately
            logger.error(err, 'Error uploading media item');
            throw err;
        }).spread((fields, files) => {
            var uploadItems = Object.keys(files).sort().map((fileKey) => {
                const file = files[fileKey];
                const index = parseInt(fileKey.substr('file_'.length));

                let tags = [];
                try {
                    tags = JSON.parse(fields[`tags_${index}`]);
                } catch(err) {}

                return {
                    file: file,
                    name: fields[`name_${index}`],
                    description: fields[`description_${index}`],
                    tags: tags
                };
            });

            return Promise.map(uploadItems, (item) => {
               return MediaHandler._isSupportedImage(item) ?
                   this._processImageUpload(item, logger) : this._processUpload(item, null, null, logger);
            });
        }).then((models) => {
            if(models.every(model => model.duplicate)) {
                const err = new Error('All new files have already been uploaded.');
                err.status = 400;
                next(err);
            } else {
                res.status(201);
                res.json(models);
            }
        });
    }

    _processImageUpload(uploadItem, logger) {

        if(!sharp) {
            const message =
                `Cannot upload images because Sharp is not installed.
                 Please ensure Sharp is installed correctly, including its dependencies.
                 See http://sharp.readthedocs.io/en/stable/install/`;
            const err = new Error(message);
            err.status = 501;
            logger.warn(err.message);
            throw err;
        }

        let dimensions = {
            width: 0,
            height: 0
        };

        const image = sharp(uploadItem.file.path);

        //get image size
        return image.metadata().then((meta) => {
            dimensions = {
                width: meta.width,
                height: meta.height
            };
            logger.debug(`Dimensions of ${uploadItem.file.path} are w:${dimensions.width}, h:${dimensions.height}`);

            //create image variations
            let variationPromises = this.imageVariations.map((variation) => {
                let format = variation.format || meta.format;
                return this._resizeImage(image, variation.label, meta, variation.size, format, logger);
            });
            return Promise.all(variationPromises);
        }).then((variations) => {
            return this._processUpload(uploadItem, dimensions, variations, logger);
        });
    }

    _processUpload(item, dimensions, variations, logger) {

        dimensions = dimensions || {};
        variations = variations || [];

        const Media = this.dbSupport.getModel('Media');

        const media = new Media({
            name: item.name,
            description: item.description || '',
            tags: item.tags,
            type: item.file.type,
            path: path.relative(this.mediaDir, item.file.path),  //save path relative to media dir
            fileName: path.basename(item.file.name),
            size: item.file.size,
            width: dimensions.width || null,
            height: dimensions.height || null,
            variations: variations
        });

        return Promise.all([ media.save(), item.file ].concat(variations).map((promise) => {
            return (promise instanceof Promise ? promise : Promise.resolve(promise)).reflect();
        })).then(result => {
            //send response
            const savePromise = result[0];
            if(savePromise.isFulfilled()) {
                //success
                const model = savePromise.value();
                return Promise.resolve(model);
            } else {
                //failure
                //collect new files to rollback (remove)
                const baseFile = result[1].value().path;
                const newUploadPaths = [ baseFile ].concat(result.slice(2).map((pathResult) => {
                    return this._getVariationPath(baseFile, pathResult.value());
                }));
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
            const rollbackPromises = err.paths.map((filePath) => {
                logger.debug(`Rolling back file upload after mongoose save failure (${filePath})`);
                return unlinkAsync(filePath);
            });
            return Promise.all(rollbackPromises).then(() => {
                //successful rollback
                logger.debug('Roll back file upload after mongoose save failure was successful');
                return {
                    duplicate: true
                };
            }).catch((err) => {
                logger.warn(err, 'Unable to rollback file modifications after mongoose save failure');
                throw err;
            });
        });
    }

    _resizeImage(image, label, fromDim, toDim, format, logger) {

        const filePath = image.options.input.file;
        const dir = path.dirname(filePath);
        const ext = path.extname(filePath);
        const base = path.basename(filePath);
        const newBase = base.substring(0, base.length - ext.length) + '.' + label;

        const fileName =  newBase + '.' + MediaHandler.getExtensionForFormat(format);
        const toPath = path.join(dir, fileName);

        let newSize = 0;
        let toWidth, toHeight;

        const ratio = fromDim.width / fromDim.height;
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

        return image.resize(parseInt(toWidth, 10), parseInt(toHeight, 10))
            .toFormat(format)
            .toBuffer().then((buffer) => {
            logger.debug('Resize OK. Saving image as %s', format);
            newSize = buffer.length;
            return writeFileAsync(toPath, buffer);
        }).then(() => {
            logger.debug('New image save to %s', toPath);
            return {
                label: label,
                format: format,
                size: newSize,
                width: Math.round(toWidth),
                height: Math.round(toHeight)
            };
        });
    }

    _getVariationPath(basePath, variation) {
        const parsedPath  = path.parse(basePath);
        let mediaPath = path.join(parsedPath.dir, `${parsedPath.name}.${variation.label}${parsedPath.ext}`);
        mediaPath = path.isAbsolute(mediaPath) ? mediaPath : path.join(this.mediaDir, mediaPath);
        return mediaPath;
    }

    static _isSupportedImage(item) {
        const imageTypes = [
            'image/jpeg',
            'image/png'
        ];

        return imageTypes.indexOf(item.file.type) > -1;
    }

    static getExtensionForFormat(format) {
        const extensions = {
            'jpeg' : 'jpg'
        };
        return extensions[format] || format;
    }
}

module.exports = new MediaHandler();