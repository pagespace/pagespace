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

var util = require('util'),
    url = require('url'),

    Promise = require('bluebird'),

    psUtil = require('../misc/pagespace-util');

var redirectStatuses = [ 301, 302, 303, 307 ];

var PageHandler = function() {
};

module.exports = new PageHandler();

PageHandler.prototype.init = function(support) {

    this.logger = support.logger;
    this.viewEngine = support.viewEngine;
    this.dbSupport = support.dbSupport;
    this.userBasePath = support.userBasePath;
    this.site = support.site;
    this.pluginResolver = support.pluginResolver;
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

    var previewMode = sessionValueSwitch(req, '_preview', 'preview');
    logger.info('New %s page request', (previewMode ? 'preview' : 'live'));

    var modelModifier = !previewMode ? 'live' : null;
    var Page = this.dbSupport.getModel('Page', modelModifier);
    var pageQueryCachKey = urlPath + '_' + modelModifier;

    ///clear cache if in preview mode
    if(previewMode) {
        this.findPagePromises[pageQueryCachKey] = null;
    }
    if(!this.findPagePromises[pageQueryCachKey]) {
        var filter = {
            url: urlPath
        };
        var query = Page.findOne(filter).populate('template redirect regions.includes.plugin');
        var findPage = Promise.promisify(query.exec, query);
        this._setFindPagePromise(pageQueryCachKey, findPage());
    }

    this.findPagePromises[pageQueryCachKey].then(function(page) {

        logger.debug('Page retrieved');

        page = page || {};

        var err;
        var promises = {};
        if(page.status) {
            //status is good
            promises.status = page.status;
        } else {
            //doesn't exist create 404
            page.status = 404;
        }

        if(page.status === 200) {
            //page found and is ok

            logger.debug('Page found (200) for %s: %s', urlPath, page.id);

            promises.page = page;

            //read data for each plugin
            page.regions.forEach(function (region, regionIndex) {
                region.includes.forEach(function(include, includeIndex) {
                    var pluginModule = self.pluginResolver.require(include.plugin ? include.plugin.module : null);
                    var includeId = regionIndex + '_' + includeIndex;
                    if (pluginModule) {
                        var regionData = include.data || {};
                        if (typeof pluginModule.process === 'function') {
                            promises[includeId] = pluginModule.process(regionData, {
                                basePath: self.userBasePath,
                                PageModel: Page,
                                req: req,
                                logger: logger.child({plugin: include.plugin.name})
                            });
                        } else {
                            promises[includeId] = regionData;
                        }
                    }
                });
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
            promises.redirect = page.redirect;
        } else {
            logger.warn('Page with unsupported status requested (%s)', page.status);
        }
        return Promise.props(promises);
    }).then(function(result) {
        var err;
        var status = result.status;
        if(status === 200) {
            var page = result.page;

            var pageData = {};
            pageData.site = self.site;
            pageData.page = page.toObject();
            pageData.preview = previewMode;
            pageData.live = !previewMode;

            //template properties
            pageData.template = {};
            page.template.properties.forEach(function(prop) {
                pageData.template[prop.name] = prop.value;
            });

            page.regions.forEach(function (region, regionIndex) {
                pageData[region.name] = {
                    data: []
                };

                var aggregatedViewPartials = [];
                region.includes.forEach(function(include, includeIndex) {
                    var pluginModule = self.pluginResolver.get(include.plugin ? include.plugin.module : null);
                    var htmlWrapper, viewPartial;
                    if(pluginModule) {
                        var includeId = regionIndex + '_' + includeIndex;
                        pageData[region.name].data[includeIndex] = {
                            data: result[includeId] || {}
                        };
                        viewPartial = pluginModule.__viewPartial ?
                            pluginModule.__viewPartial : 'The view partial could not be resolved';
                        if(previewMode) {
                            htmlWrapper =
                                '<div data-plugin="%s" ' +
                                'data-page-id="%s" ' +
                                'data-region="%s" ' +
                                'data-include="%s">\n%s\n</div>';
                            viewPartial = util.format(htmlWrapper, pluginModule.__config.name, page._id, region.name,
                                includeIndex, viewPartial);
                        } else {
                            htmlWrapper = '<div>\n%s\n</div>';
                            viewPartial = util.format(htmlWrapper, viewPartial);
                        }
                    } else {
                        pageData[region.name].data[includeIndex] = {
                            data: null
                        };
                        htmlWrapper = '<!-- Region: %s, Include %s -->';
                        viewPartial = util.format(htmlWrapper, region.name, includeIndex);
                    }
                    aggregatedViewPartials.push('{{#with data.[' + includeIndex + ']}}' + viewPartial + '{{/with}}');
                });
                self.viewEngine.registerPartial(region.name, aggregatedViewPartials.join('\n'), urlPath);
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
            var redirectPage = result.redirect;
            if(redirectPage && redirectPage.url) {
                res.redirect(status, redirectPage.url);
            } else {
                logger.warn('Page to redirect to is not set. Sending 404');
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