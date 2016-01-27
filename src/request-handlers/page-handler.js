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

var util = require('util'),
    url = require('url'),
    Promise = require('bluebird'),
    psUtil = require('../support/pagespace-util'),
    consts = require('../app-constants'),
    includeCache = require('../support/include-cache');

var httpStatus = {
    OK: 200,
    NOT_FOUND: 404,
    GONE: 410,
    SERVER_ERROR: 500,
    REDIRECTS: [ 301, 302, 303, 307 ]
};

var FIND_PAGE_CACHE_DURATION = 1000 * 60;

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
    this.localeResolver = support.localeResolver;
    this.analytics = support.analytics;
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

    if(req.method !== 'GET') {
        var err = new Error('Unsupported method');
        err.status = 405;
        return next(err);
    }

    var urlPath = url.parse(req.url).pathname;

    var previewMode = sessionValueSwitch(req, '_preview', 'preview');
    logger.info('New %s page request', (previewMode ? 'preview' : 'live'));

    var modelModifier = !previewMode ? 'live' : null;
    var Page = this.dbSupport.getModel('Page', modelModifier);
    var pageQueryCachKey = urlPath + '_' + modelModifier;

    //create the page query and execute it and cache it
    var findPagePromise = this.findPagePromises[pageQueryCachKey];
    if(previewMode || !findPagePromise) {
        var filter = {
            url: urlPath
        };
        var query = Page.findOne(filter).populate('template redirect regions.includes.plugin regions.includes.include');
        findPagePromise = Promise.promisify(query.exec, { context: query })();
        if(!previewMode) {
            this._setFindPagePromise(pageQueryCachKey, findPagePromise);
        }
    }

    //get the page from the db!
    findPagePromise.then(function(page) {
        var status = page ? page.status : httpStatus.NOT_FOUND;

        var pageProps = {
            page: page,
            status: status,
            previewMode: previewMode,
            urlPath: urlPath
        };

        //analytics. page exists and its a guest user
        if(self.analytics && page && (!req.user || req.user.role === consts.GUEST_USER.role)) {
            self.recordHit(req, page._id, logger);
        }

        if(status === httpStatus.OK) {
            logger.debug('Page found (%s) for %s: %s', status, urlPath, page.id);
            //each region may need to be processed, this may be async
            pageProps = self.getProcessedPageRegions(req, logger, page, Page, pageProps);
        } else {
            //don't cache none 200s
            delete self.findPagePromises[pageQueryCachKey];
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
        next(err);
    });
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
    page.regions.forEach(function (region) {
        region.includes.forEach(function(includeWrapper) {
            var includeId = includeWrapper.include._id.toString();
            pageProps[includeId] = self.processInclude(req, includeWrapper, includeId, pageProps.previewMode);
        });
    });

    return pageProps;
};

/**
 * Processes a single include
 */
PageHandler.prototype.processInclude = function(req, includeWrapper, includeId, previewMode) {

    var self = this;

    var pluginModule = this.pluginResolver.require(includeWrapper.plugin ? includeWrapper.plugin.module : null);
    if(pluginModule) {
        var cache = includeCache.getCache(pluginModule.name, {
            ttl: pluginModule.ttl
        });
        return cache.get(includeId).then(function(result) {
            if(result && !previewMode) {
                return result;
            }

            var includeData = includeWrapper.include && includeWrapper.include.data ? includeWrapper.include.data : {};
            if (typeof pluginModule.process === 'function') {
                result = pluginModule.process(includeData, {
                    preview: previewMode,
                    reqUrl: req.url,
                    reqMethod: req.method
                }).then(function(val) {
                    //don't cache in preview mode
                    return !previewMode ? cache.set(includeId, val) : val;
                }).then(null, function(err) { //not 'catch', this might not be a Bluebird promise
                    self.logger.warn(err, 'Could not process include for %s (%s) at %s',
                        pluginModule.name, includeId, req.url);
                    return {};
                });
            } else {
                result = includeData;
            }
            return result;
        });
    }
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

    page.regions.forEach(function (region) {
        pageData[region.name] = {
            ctx: []
        };

        var aggregatedViewPartials = [];
        region.includes.forEach(function(includeWrappper, includeIndex) {
            var pluginModule =
                self.pluginResolver.require(includeWrappper.plugin ? includeWrappper.plugin.module : null);
            var htmlWrapper, viewPartial;
            if(pluginModule) {
                var includeId = includeWrappper.include._id.toString();
                pageData[region.name].ctx[includeIndex] = pageResult[includeId] || {};
                viewPartial = pluginModule.viewPartial ?
                    pluginModule.viewPartial : 'The view partial could not be resolved';
                if(pageResult.previewMode) {
                    htmlWrapper =
                        '<div ' +
                        'data-plugin="%s" ' +
                        'data-page-id="%s" ' +
                        'data-region-name="%s" ' +
                        'data-include="%s" ' +
                        'data-data-id="%s" ' +
                        '>\n%s\n</div>';
                    viewPartial = util.format(htmlWrapper,
                                              pluginModule.name,
                                              page._id,
                                              region.name,
                                              includeIndex,
                                              includeWrappper.include ? includeWrappper.include._id : null,
                                              viewPartial);
                } else {
                    htmlWrapper = '<div>\n%s\n</div>';
                    viewPartial = util.format(htmlWrapper, viewPartial);
                }
            } else {
                pageData[region.name].ctx[includeIndex] = {};
                htmlWrapper = '<!-- Region: %s, Include %s -->';
                viewPartial = util.format(htmlWrapper, region.name, includeIndex);
            }

            //wrap each include in a with to give it the correct context
            aggregatedViewPartials.push('{{#with ctx.[' + includeIndex + ']}}' + viewPartial + '{{/with}}');
        });

        //each page has its own handlebars instance and partials are cached for that instance using the url as a key
        var regionHtml = util.format('<div data-page-id="%s" data-region="%s">%s</div>',
            page._id, region.name, aggregatedViewPartials.join('\n'));
        self.viewEngine.registerPartial(region.name, regionHtml, pageResult.urlPath);
    });

    var templateSrc = !page.template ? 'default.hbs' : page.template.src;

    //force an extension
    if(!/\.hbs$/.test(templateSrc)) {
        templateSrc += '.hbs';
    }
    pageData.__template = pageResult.urlPath;
    pageData.__locale = this.localeResolver(req, pageResult);
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
    var redirectPage = pageResult.page.redirect;
    if(redirectPage && redirectPage.url) {
        res.redirect(pageResult.status, redirectPage.url);
    } else {
        logger.warn('Page to redirect to is not set. Sending 404');
        pageResult.status = httpStatus.NOT_FOUND;
        return this.doNotFound(logger, pageResult);
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
 * Records a page hit
 * @param req
 * @param pageId
 * @param logger
 */
PageHandler.prototype.recordHit = function(req, pageId, logger) {

    var Hit = this.dbSupport.getModel('Hit');
    var hit = new Hit({
        page: pageId,
        ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
        referrer: req.headers['referrer'], // jshint ignore:line
        agent: req.headers['user-agent'],
        session: req.sessionID
    });
    hit.save().then(null, function (err) {
        logger.warn(err, 'Couldn\'t save page hit');
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
    }, FIND_PAGE_CACHE_DURATION);
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