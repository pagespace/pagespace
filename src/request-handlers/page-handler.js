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
    url = require('url'),
    path = require('path'),

    Promise = require('bluebird'),

    psUtil = require('../misc/pagespace-util');

var redirectStatuses = [ 301, 302, 303, 307 ];

var readFileAsync = Promise.promisify(fs.readFile);
var adminbarFilePromise = null;

var PageHandler = function() {
};

module.exports = new PageHandler();

PageHandler.prototype.init = function(support) {

    this.logger = support.logger;
    this.viewEngine = support.viewEngine;
    this.dbSupport = support.dbSupport;
    this.userBasePath = support.userBasePath;
    this.site = support.site;
    this.partResolver = support.partResolver;
    this.reqCount = 0;
    this.findPagePromises = {};

    var self = this;
    return function(req, res, next) {
        return self.doRequest(req, res, next);
    };
};

/**
 * Process a valid request
 */
PageHandler.prototype.doRequest = function(req, res, next) {

    var self = this;
    var logger = psUtil.getRequestLogger(this.logger, req, 'page', ++this.reqCount);

    var urlPath = url.parse(req.url).pathname;

    function sessionValueSwitch(req, queryParam, sessionKey) {
        if(req.query[queryParam]) {
            if(req.user && req.user.role !== 'guest' && psUtil.typeify(req.query[queryParam]) === true) {
                logger.debug('Switching %s on', sessionKey);
                req.session[sessionKey] = true;
            } else if(psUtil.typeify(req.query[queryParam]) === false) {
                logger.debug('Switching %s off', sessionKey);
                req.session[sessionKey] = false;
            }
        }
        return req.session[sessionKey] || false;
    }

    var showAdminBar = req.user && req.user.role !== 'guest';
    var stagingMode = sessionValueSwitch(req, '_staging', 'staging');
    logger.info('New %s page request', (stagingMode ? 'staging' : 'live'));

    var modelModifier = !stagingMode ? 'live' : null;
    var Page = this.dbSupport.getModel('Page', modelModifier);
    var pageQueryCachKey = urlPath + '_' + modelModifier;

    ///clear cache if in staging mode
    if(stagingMode) {
        this.findPagePromises[pageQueryCachKey] = null;
    }
    if(!this.findPagePromises[pageQueryCachKey]) {
        var filter = {
            url: urlPath
        };
        var query = Page.findOne(filter).populate('template redirect regions.part');
        var findPage = Promise.promisify(query.exec, query);
        this._setFindPagePromise(pageQueryCachKey, findPage());
    }

    this.findPagePromises[pageQueryCachKey].then(function(page) {

        logger.debug('Page retrieved');

        page = page || {};

        var err;
        var promises = [];
        if(page.status) {
            //status is good
            promises.push(page.status);
        } else {
            //doesn't exist create 404
            page.status = 404;
        }

        if(page.status === 200) {
            //page found and is ok

            logger.debug('Page found (200) for %s: %s', urlPath, page.id);

            promises.push(page);

            if(showAdminBar) {
                var adminBarLocation = path.join(__dirname, '/../../views/adminbar.hbs');
                logger.debug('Showing admin bar (from: %s) ', adminBarLocation);
                adminbarFilePromise = adminbarFilePromise || readFileAsync(adminBarLocation, 'utf8');
                promises.push(adminbarFilePromise);
            } else {
                //push empty promise, so spread args are still right
                promises.push('');
            }

            //read data for each part
            page.regions.forEach(function (region) {
                var partModule = self.partResolver.require(region.part ? region.part.module : null);
                if(partModule && typeof partModule.process === 'function') {
                    var regionData = region.data || {};
                    var partPromise = partModule.process(regionData, {
                        basePath: self.userBasePath,
                        PageModel: Page,
                        req: req,
                        logger: logger.child({part: region.part.name})
                    });
                    promises.push(partPromise);
                } else {
                    promises.push(null);
                }
            });
        } else if(page.status === 404) {
            //page is a 404
            logger.info('Request is 404, passing to next()');
            err = new Error('Page not found (404) for: ' + urlPath);
            err.status = 404;
            throw err;
        } else if(page.status === 410) {
            //page is a 410 (gone)
            logger.info('Request is 410, passing to next()');
            err = new Error('Page gone (410) for: ' + urlPath);
            err.status = 410;
            throw err;
        } else if(redirectStatuses.indexOf(page.status) >= 0) {
            //page is a redirect (301, 302, 303, 307)
            logger.info('Request is %s, handling redirect', page.status);
            promises.push(page.redirect);
        } else {
            logger.warn('Page with unsupported status requested (%s)', page.status);
        }
        return promises;
    }).spread(function() {
        var err;
        var args = Array.prototype.slice.call(arguments, 0);
        var status = args.shift();
        if(status === 200) {
            var page = args.shift();
            var adminBar = args.shift();

            self.viewEngine.registerPartial('adminbar', adminBar, urlPath);

            var pageData = {};
            pageData.site = self.site;
            pageData.page = page.toObject();
            pageData.staging = stagingMode;
            pageData.live = !stagingMode;

            //template properties
            pageData.template = {};
            page.template.properties.forEach(function(prop) {
                pageData.template[prop.name] = prop.value;
            });

            page.regions.forEach(function (region, i) {
                if (region.part) {
                    pageData[region.name] = {
                        data: args[i] || {},
                        edit: pageData.edit,
                        region: region.name,
                        pageId: page._id
                    };

                    var partModule = self.partResolver.get(region.part ? region.part.module : null);
                    var viewPartial;
                    if(!partModule) {
                        viewPartial = '<!-- Region: ' + region.name + ' -->';
                        if(region.part) {
                            self.logger.warn('The view partial for %s could not be resolved', partModule);
                        }
                    } else {
                        viewPartial = partModule.__viewPartial;
                    }
                    self.viewEngine.registerPartial(region.name, viewPartial, urlPath);
                }
            });

            var templateSrc = !page.template ? 'default.hbs' : page.template.src;

            //force an extension
            if(!/\.hbs$/.test(templateSrc)) {
                templateSrc += '.hbs';
            }
            pageData.__template = urlPath;
            res.render(templateSrc, pageData, function(err, html) {
                if(err) {
                    logger.error(err, 'Trying to render page');
                    next(err);
                } else {
                    logger.info('Page request processed OK in %s ms', Date.now() - req.startTime);
                    res.send(html);
                }
            });
        } else if(redirectStatuses.indexOf(status) >= 0) {
            //redirects
            var redirectPage = args.shift();
            if(redirectPage && redirectPage.url) {
                res.redirect(status, redirectPage.url);
            } else {
                logger('Page to redirect to is not set. Sending 404');
                err = new Error('Page not found for ' + urlPath);
                err.status = 404;
                throw err;
            }
        } else {
            err = new Error('Status not supported');
            err.status = status;
            next(err);
        }
    }).catch(function(err) {
        logger.error(err);
        next(err);
    });
};

PageHandler.prototype._setFindPagePromise = function(key, promise) {
    var self = this;
    this.findPagePromises[key] = promise;

    //simple cache expiration. nice to be a lru impl...
    setTimeout(function() {
        delete self.findPagePromises[key];
    }, 60 * 1000);
};