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

var httpStatus = {
    OK: 200,
    NOT_FOUND: 404,
    GONE: 410,
    SERVER_ERROR: 500,
    REDIRECTS: [ 301, 302, 303, 307 ]
};

var PageHandler = function() {};

module.exports = new PageHandler();

/**
 * Initalizes the page handler middleware
 * @param support
 * @returns {Function}
 */
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
 * Process a page request
 */
PageHandler.prototype.doRequest = function(req, res, next) {

    var self = this;
    var logger = psUtil.getRequestLogger(this.logger, req, 'page', ++this.reqCount);

    var urlPath = url.parse(req.url).pathname;

    var previewMode = sessionValueSwitch(req, '_preview', 'preview');
    logger.info('New %s page request', (previewMode ? 'preview' : 'live'));

    var modelModifier = !previewMode ? 'live' : null;
    var Page = this.dbSupport.getModel('Page', modelModifier);
    var pageQueryCachKey = urlPath + '_' + modelModifier;

    if(previewMode) {
        ///clear cache if in preview mode
        this.findPagePromises[pageQueryCachKey] = null;
    }

    //create the page query and execute it and cache it
    if(!this.findPagePromises[pageQueryCachKey]) {
        var filter = {
            url: urlPath
        };
        var query = Page.findOne(filter).populate('template redirect regions.includes.plugin');
        var findPage = Promise.promisify(query.exec, query);
        this._setFindPagePromise(pageQueryCachKey, findPage());
    }

    //get the page from the db!
    this.findPagePromises[pageQueryCachKey].then(function(page) {
        var status = page ? page.status : httpStatus.NOT_FOUND;

        var pageProps = {
            page: page,
            status: status,
            previewMode: previewMode,
            urlPath: urlPath
        };

        if(status === httpStatus.OK) {
            logger.debug('Page found (%s) for %s: %s', status, urlPath, page.id);
            //each region may need to be processed, this may be async
            pageProps = self.getProcessedPageRegions(req, logger, page, Page, pageProps);
        }

        return Promise.props(pageProps);
    }).then(function(pageResult) {
        var status = pageResult.status;
        if(status === httpStatus.OK) {
            //all include plugins have resolved and the page can be rendered
            self.doPage(req, res, next, logger, pageResult);
        } else if(httpStatus.REDIRECTS.indexOf(status) >= 0) {
            //handle redirects
            logger.info('Request is %s, handling redirect', status);
            self.doRedirect(req, res, next, logger, pageResult);
        } else if(status === httpStatus.NOT_FOUND || status === httpStatus.GONE) {
            //not found or gone
            self.doNotFound(logger, pageResult);
        } else {
            //something else?
            var message = util.format('Status %s is not supported for pages', status);
            logger.warn(message);
            var err = new Error(message);
            err.status = 500;
            next(err);
        }
    }).catch(function(err) {
        logger.error(err);
        next(err);
    });
};

/**
 * Caches the promise for finding a page by its url. Expires after a minute for live mode
 * @param key
 * @param promise
 * @private
 */
PageHandler.prototype._setFindPagePromise = function(key, promise) {
    var self = this;
    this.findPagePromises[key] = promise;

    //simple cache expiration. nice to be a lru impl...
    setTimeout(function() {
        delete self.findPagePromises[key];
    }, 60 * 1000);
};

/**
 * Returns a map of page includes to their data (which may need to be processed by the plugin)
 * @param logger
 * @param page
 * @param pageModel
 * @param pageProps
 * @returns {*}
 */
PageHandler.prototype.getProcessedPageRegions = function(req, logger, page, pageModel, pageProps) {

    var self = this;

    //read data for each plugin
    page.regions.forEach(function (region, regionIndex) {
        region.includes.forEach(function(include, includeIndex) {
            var pluginModule = self.pluginResolver.require(include.plugin ? include.plugin.module : null);
            var includeId = regionIndex + '_' + includeIndex;
            if (pluginModule) {
                var regionData = include.data || {};
                if (typeof pluginModule.process === 'function') {
                    pageProps[includeId] = pluginModule.process(regionData, {
                        basePath: self.userBasePath,
                        PageModel: pageModel,
                        req: req,
                        logger: logger.child({plugin: include.plugin.name})
                    });
                } else {
                    pageProps[includeId] = regionData;
                }
            }
        });
    });

    return pageProps;
};

/**
 * Resolves a page.
 * @param req
 * @param res
 * @param next
 * @param logger
 * @param pageResult
 */
PageHandler.prototype.doPage = function(req, res, next, logger, pageResult) {

    var self = this;

    var page = pageResult.page;

    var pageData = {};
    pageData.site = self.site;
    pageData.page = page.toObject();
    pageData.preview = pageResult.previewMode;
    pageData.live = !pageResult.previewMode;

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
                    data: pageResult[includeId] || {}
                };
                viewPartial = pluginModule.__viewPartial ?
                    pluginModule.__viewPartial : 'The view partial could not be resolved';
                if(pageResult.previewMode) {
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

            //wrap each include in a with to give it the correct context
            aggregatedViewPartials.push('{{#with data.[' + includeIndex + ']}}' + viewPartial + '{{/with}}');
        });

        //each page has its own handlebars instance and partials are cached for that instance usign the url as a key
        self.viewEngine.registerPartial(region.name, aggregatedViewPartials.join('\n'), pageResult.urlPath);
    });

    var templateSrc = !page.template ? 'default.hbs' : page.template.src;

    //force an extension
    if(!/\.hbs$/.test(templateSrc)) {
        templateSrc += '.hbs';
    }
    pageData.__template = pageResult.urlPath;
    res.render(templateSrc, pageData, function(err, html) {
        if(err) {
            logger.error(err, 'Unable to render page');
            next(err);
        } else {
            logger.info('Page request processed OK in %s ms', Date.now() - req.startTime);
            res.send(html);
        }
    });
};

/**
 * Sends redirects
 * @param req
 * @param res
 * @param next
 * @param logger
 * @param pageResult
 */
PageHandler.prototype.doRedirect = function(req, res, next, logger, pageResult) {
    //redirects
    var redirectPage = pageResult.redirect;
    if(redirectPage && redirectPage.url) {
        res.redirect(pageResult.status, redirectPage.url);
    } else {
        logger.warn('Page to redirect to is not set. Sending 404');
        var err = new Error('Page not found for ' + pageResult.urlPath);
        err.status = 404;
        throw err;
    }
};

/**
 * Throws an error for missing pages (404 and 410)
 * @param logger
 * @param result
 * @param urlPath
 */
PageHandler.prototype.doNotFound = function(logger, pageResult) {
    //page is a 404
    var status = pageResult.status;
    logger.info('Request is %s, passing to next()', status);
    var errMessage  = status === httpStatus.GONE ? 'The page, %s, has gone (%s)' : 'Page not found for %s (%s)';
    var err = new Error(util.format(errMessage, pageResult.urlPath, status));
    err.status = status;
    throw err;
};

/**
 * Utility to check session values set by query params (such as preview mode)
 * @param req
 * @param queryParam
 * @param sessionKey
 * @returns {*|boolean}
 */
function sessionValueSwitch(req, queryParam, sessionKey) {
    if(req.query[queryParam]) {
        if(req.user && req.user.role !== 'guest' && psUtil.typeify(req.query[queryParam]) === true) {
            req.session[sessionKey] = true;
        } else if(psUtil.typeify(req.query[queryParam]) === false) {
            req.session[sessionKey] = false;
        }
    }
    return req.session[sessionKey] || false;
}