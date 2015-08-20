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

//support
var fs = require('fs'),
    util = require('util'),
    path = require('path'),

    send = require('send'),
    Promise = require('bluebird'),

    consts = require('../app-constants'),
    psUtil = require('../misc/pagespace-util');

var readFileAsync = Promise.promisify(fs.readFile);

var reqTypes  = {
    TEMPLATES: 'available',
    TEMPLATE_REGIONS: 'template-regions',
    TEMPLATE_TEST: 'test',
    TEMPLATE_PREVIEW: 'preview'

};

var TemplatesHandler = function() {
};

module.exports = new TemplatesHandler();

TemplatesHandler.prototype.init = function(support) {

    this.logger = support.logger;
    this.viewEngine = support.viewEngine;
    this.reqCount = 0;

    this.templateShotsDir = path.join(support.userBasePath, '/template-shots');

    var self = this;
    return function(req, res, next) {
        return self.doRequest(req, res, next);
    };
};

TemplatesHandler.prototype.doRequest = function(req, res, next) {

    var logger = psUtil.getRequestLogger(this.logger, req, 'templates', ++this.reqCount);

    var reqInfo = consts.requests.TEMPLATES.regex.exec(req.url);
    var reqType = reqInfo[1];

    if(reqType === reqTypes.TEMPLATES && req.method === 'GET') {
        logger.info('New getAvailableTemplates request');
        return this.doGetAvailableTemplates(req, res, next, logger);
    } else if (reqType === reqTypes.TEMPLATE_REGIONS && req.method === 'GET') {
        logger.info('New getRegionsForTemplate request');
        return this.doGetRegionsForTemplate(req, res, next, logger);
    } else if (reqType === reqTypes.TEMPLATE_TEST && req.method === 'GET') {
        logger.info('New templateTest request');
        return this.doTemplateTest(req, res, next, logger);
    } else if(reqType === reqTypes.TEMPLATE_PREVIEW && req.method === 'GET') {
        logger.info('New templatePreview request');
        return this.doGetTemplatePreview(req, res, next, logger);
    } else {
        var err = new Error('Unrecognized method');
        err.status = 405;
        next(err);
    }
};

/**
 * Responds with a list of available handlebars templates on the filesystem
 * @param req
 * @param res
 * @param next
 * @param logger
 * @returns {*}
 */
TemplatesHandler.prototype.doGetAvailableTemplates = function(req, res, next, logger) {

    var views = null;
    try {
        views = getViewDirs(req);
    } catch(e) {
        return next(e);
    }

    var walkPromises = views.map(function(viewDir) {
        return walkFiles(viewDir);
    });
    Promise.all(walkPromises).then(function(fileSets) {
        var files = Array.prototype.slice(fileSets).concat.apply([], fileSets).map(function(file) {
            return file.replace(/^\//, '');
        });
        logger.debug('Found the following templates: %s', files.join(', '));
        return res.json(files);
    }).catch(function(e) {
        next(e);
    });
};

//walk the dir and gets
var readdirAsync = Promise.promisify(fs.readdir);
var statAsync = Promise.promisify(fs.stat);
function walkFiles (directory, baseDirectory) {
    baseDirectory = baseDirectory || directory;
    var results = [];
    return readdirAsync(directory).map(function(file) {
        file = path.join(directory, file);
        return statAsync(file).then(function(stat) {
            if (stat.isFile()) {
                return results.push(file.substr(baseDirectory.length));
            }
            return walkFiles(file, baseDirectory).then(function(filesInDir) {
                results = results.concat(filesInDir);
            });
        });
    }).then(function() {
        return results;
    });
}

/**
 * Responds with a list of available regions for the given template
 * @param req
 * @param res
 * @param next
 * @param logger
 * @returns {*}
 */
TemplatesHandler.prototype.doGetRegionsForTemplate = function(req, res, next) {
    var templateSrc = req.query.templateSrc;

    var err;
    if(!templateSrc) {
        err = new Error('No template url given');
        err.status = 404;
        next(err);
    }

    var viewDirs = null;
    try {
        viewDirs = getViewDirs(req);
    } catch(e) {
        return next(e);
    }

    this.getRegionsForTemplate(templateSrc, viewDirs).then(function(regions) {
        return res.json(regions);
    });
};

/**
 * @private
 * @param templateSrc
 * @param viewDirs
 * @returns {*}
 */
TemplatesHandler.prototype.getRegionsForTemplate = function(templateSrc, viewDirs) {

    var readPromises = viewDirs.map(function(viewDir) {
        var templateFile = path.join(viewDir, templateSrc);
        return readFileAsync(templateFile, 'utf8');
    });

    return Promise.any(readPromises).then(function(templateHtml) {

        var findPartial = /{{\s*>\s*(\w+)\s*}}/g;

        var regions = [];
        var regexResult;
        while ((regexResult = findPartial.exec(templateHtml)) !== null) {
            regions.push(regexResult[1]);
        }

        regions = regions.filter(function(region) {
            return region !== 'adminbar';
        });

        return regions;
    });
};

function getViewDirs(req) {

    var views = req.app.get('views');
    if(!views || (typeof views !== 'string' && !(views instanceof Array))) {
        var err = new Error('Cannot find templates. No view dirs are defined');
        err.status = 501;
        throw err;
    }

    if(typeof views === 'string') {
        views = [ views ];
    }
    return views;
}

/**
 * Responds with a rendered image of a template
 * @param req
 * @param res
 * @param next
 * @param logger
 */
TemplatesHandler.prototype.doGetTemplatePreview = function(req, res, next, logger) {

    var templateSrc = req.query.templateSrc;
    var regionOutlineColor = req.query.regionOutlineColor || '#ff005a';
    var templateShotFile = path.join(this.templateShotsDir, path.basename(templateSrc, '.hbs') + '.png');

    logger.debug('Template source file is %s', templateSrc);
    logger.info('Preview will be saved to: %s', templateShotFile);
    logger.debug('Using region outline color: %s', regionOutlineColor);

    //launch phantom
    var phantom = require('node-phantom');
    phantom.create(function(err, phantom) {

        if(err) {
            logger.warn('Cannot do preview, PhantomJS is not available.');
            err.status = 500;
            return next(err);
        }

        logger.info('Launched Phantom instance');
        return phantom.createPage(function(err, page) {
            logger.info('Phantom page created');

            //TODO: hard coded address
            var templatePreviewUrl = 'http://localhost:9999/_templates/test?templateSrc=' +
                encodeURIComponent(templateSrc) + '&regionOutlineColor=' + encodeURIComponent(regionOutlineColor);
            logger.info('Opening url [%s]...', templatePreviewUrl);

            page.open(templatePreviewUrl,  function(err, status) {
                logger.info('Page opened with status: %s', status);
                if(status === 'success') {
                    page.viewportSize = { width: 1920, height: 1080 };
                    logger.info('Save screenshot of page...');
                    page.render(templateShotFile, function() {
                        logger.info('Screenshot saved. Exiting phantom...');
                        phantom.exit();

                        logger.info('Sending %s to client', templateShotFile);
                        var stream = send(req, templateShotFile);

                        // forward non-404 errors
                        stream.on('error', function error(err) {
                            logger.warn('Error streaming template screenshot for %s', req.url);
                            next(err.status === 404 ? null : err);
                        });

                        stream.on('end', function end () {
                           logger.info('Template screenshot sent.');
                        });

                        res.type('png');
                        stream.pipe(res);
                    });
                }
            });
        });
    });
};

/**
 * Renders a test page using a given template
 * This handler is usually called (via phantomjs) from the doGetTemplatePreview method for generating preview
 * images
 * @param req
 * @param res
 * @param next
 * @param logger
 * @returns {*}
 */
TemplatesHandler.prototype.doTemplateTest = function(req, res, next, logger) {

    var self = this;

    var templateSrc = req.query.templateSrc;
    var regionOutlineColor = req.query.regionOutlineColor || '#ff005a';

    var err;
    if(!templateSrc) {
        err = new Error('No template url given');
        err.status = 404;
        next(err);
    }

    var viewDirs = null;
    try {
        viewDirs = getViewDirs(req);
    } catch(e) {
        return next(e);
    }

    this.getRegionsForTemplate(templateSrc, viewDirs).then(function(regions) {

        logger.debug('Rendering template test for [%s] with regions [%s]', templateSrc, regions.join(', '));

        var pageData = {};
        pageData.__template = '/template-test';

        var REGION_FILLER_HTML =
            '<div style="height: %spx; outline: 2px solid %s">' +
                '<div style="text-align: center; padding: 10px"><p><b>%s</b></p></div>' +
            '</div>';

        regions.forEach(function(region) {
            if(region !== 'adminbar') {

                pageData[region] = {
                    data: {},
                    edit: false,
                    region: region
                };

                var partialFillerHtml = util.format(REGION_FILLER_HTML, 200, regionOutlineColor, region);
                self.viewEngine.registerPartial(region, partialFillerHtml, pageData.__template);
            }
        });
        self.viewEngine.registerPartial('adminbar', '', pageData.__template);

        //make it make a request to the test url
        res.render(templateSrc, pageData, function(err, html) {
            if(err) {
                logger.error(err, 'Trying to render page');
                next(err);
            } else {
                logger.debug('Sending template test');
                res.send(html);
            }
        });
    });
};