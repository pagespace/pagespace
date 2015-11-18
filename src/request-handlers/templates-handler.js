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

//support
var fs = require('fs'),
    path = require('path'),

    VError = require('verror'),
    Promise = require('bluebird'),

    consts = require('../app-constants'),
    psUtil = require('../support/pagespace-util');

var readFileAsync = Promise.promisify(fs.readFile);

var DEFAULT_VIEW_DIR = '/views/pagespace';

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
        logger.debug('Using the following dirs as possible template locations: %s', views.join(', '));
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
TemplatesHandler.prototype.doGetRegionsForTemplate = function(req, res, next, logger) {
    var templateSrc = req.query.templateSrc;

    var err;
    if(!templateSrc) {
        err = new Error('No template url given');
        logger.warn(err);
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
        logger.debug('Found the following regions for: %s (%s)', templateSrc, viewDirs.join(', '));
        return res.json(regions);
    }).catch(function(err) {
        err = new VError(err, 'Could not find template: "%s"', templateSrc);
        err.status = 404;
        return next(err);
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

    views = views.filter(function(view) {
        //strip default pagespace view dir from available template directories
        return view.indexOf(DEFAULT_VIEW_DIR) === -1;
    });

    return views;
}