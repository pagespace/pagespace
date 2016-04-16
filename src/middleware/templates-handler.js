/**
 * Copyright © 2016, Versatile Internet
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
    Promise = require('bluebird'),
    BaseHandler = require('./base-handler');

const readFileAsync = Promise.promisify(fs.readFile);

const DEFAULT_VIEW_DIR = '/views/pagespace';

const reqTypes  = {
    TEMPLATES: 'available',
    TEMPLATE_REGIONS: 'template-regions',
    TEMPLATE_TEST: 'test',
    TEMPLATE_PREVIEW: 'preview'
};

class TemplatesHandler extends BaseHandler {
    
    get pattern() {
        return new RegExp('^/_templates/(available|template-regions)');
    }

    init(support) {
        this.logger = support.logger;
        this.viewEngine = support.viewEngine;
    }

    doGet(req, res, next) {
        const logger = this.getRequestLogger(this.logger, req);
    
        const urlPath = url.parse(req.url).pathname;
        const reqInfo = this.pattern.regex.exec(urlPath);
        const reqType = reqInfo[1];
    
        if(reqType === reqTypes.TEMPLATES) {
            logger.info('New getAvailableTemplates request');
            return this.doGetAvailableTemplates(req, res, next, logger);
        } else if (reqType === reqTypes.TEMPLATE_REGIONS) {
            logger.info('New getRegionsForTemplate request');
            return this.doGetRegionsForTemplate(req, res, next, logger);
        }
    }

    /**
     * Responds with a list of available handlebars templates on the filesystem
     */
    doGetAvailableTemplates(req, res, next, logger) {
    
        let views = null;
        try {
            views = getViewDirs(req);
            logger.debug('Using the following dirs as possible template locations: %s', views.join(', '));
        } catch(err) {
            return next(err);
        }
    
        const walkPromises = views.map((viewDir) => walkFiles(viewDir));
        Promise.all(walkPromises).then((fileSets) => {
            const files = Array.prototype.slice(fileSets).concat.apply([], fileSets).map((file) => file.replace(/^\//, ''));
            logger.debug('Found the following templates: %s', files.join(', '));
            return res.json(files);
        }).catch((err) => {
            next(err);
        });
    }

    /**
     * Responds with a list of available regions for the given template
     */
    doGetRegionsForTemplate(req, res, next, logger) {
        const templateSrc = req.query.templateSrc;
    
        if(!templateSrc) {
            const err = new Error('No template url given');
            logger.warn(err);
            err.status = 404;
            next(err);
        }
    
        let viewDirs = null;
        try {
            viewDirs = getViewDirs(req);
        } catch(e) {
            return next(e);
        }
    
        this.getRegionsForTemplate(templateSrc, viewDirs).then((regions) => {
            viewDirs = viewDirs.join(', ');
            logger.debug(`Found the following regions for: ${templateSrc} (${viewDirs})`);
            return res.json(regions);
        }).catch((err) => {
            err = new Error(`Could not find template: ${templateSrc}`);
            err.status = 404;
            return next(err);
        });
    }
    
    getRegionsForTemplate(templateSrc, viewDirs) {
    
        const readPromises = viewDirs.map((viewDir) => readFileAsync(path.join(viewDir, templateSrc), 'utf8'));
    
        return Promise.any(readPromises).then((templateHtml) => {
    
            const findPartial = /{{\s*>\s*(\w+)\s*}}/g;
    
            let regions = [];
            let regexResult;
            while ((regexResult = findPartial.exec(templateHtml)) !== null) {
                regions.push(regexResult[1]);
            }
    
            return regions;
        });
    }
    
}

module.exports = new TemplatesHandler();

//walk the dir and gets
const readdirAsync = Promise.promisify(fs.readdir);
const statAsync = Promise.promisify(fs.stat);
function walkFiles(directory, baseDirectory)  {
    baseDirectory = baseDirectory || directory;
    let results = [];
    return readdirAsync(directory).map((file) => {
        file = path.join(directory, file);
        return statAsync(file).then((stat) => {
            if (stat.isFile()) {
                return results.push(file.substr(baseDirectory.length));
            }
            return walkFiles(file, baseDirectory).then((filesInDir) => {
                results = results.concat(filesInDir);
            });
        });
    }).then(() => {
        return results;
    });
}


function getViewDirs(req) {

    let views = req.app.get('views');
    if(!views || (typeof views !== 'string' && !(views instanceof Array))) {
        const err = new Error('Cannot find templates. No view dirs are defined');
        err.status = 501;
        throw err;
    }

    if(typeof views === 'string') {
        views = [ views ];
    }

    //strip default pagespace view dir from available template directories
    views = views.filter((view) => view.indexOf(DEFAULT_VIEW_DIR) === -1);

    return views;
}