'use strict';

//deps
const
    Promise = require('bluebird'),
    typeify = require('../support/typeify'),
    consts = require('../app-constants'),
    includeCache = require('../support/include-cache'),
    BaseHandler = require('./base-handler');

const httpStatus = {
    OK: 200,
    NOT_FOUND: 404,
    GONE: 410,
    SERVER_ERROR: 500,
    REDIRECTS: [ 301, 302, 303, 307 ]
};

const FIND_PAGE_CACHE_DURATION = 1000 * 60;

class PageHandler extends BaseHandler {
    get pattern() {
        return /.*/;
    }

    /**
     * Initializes the page handler middleware
     */
    init(support) {
    
        this.logger = support.logger;
        this.viewEngine = support.viewEngine;
        this.dbSupport = support.dbSupport;
        this.userBasePath = support.userBasePath;
        this.site = support.site;
        this.pluginResolver = support.pluginResolver;
        this.localeResolver = support.localeResolver;
        this.analytics = support.analytics;
        this.findPagePromises = {};
    }

    /**
     * Process a page request
     */
    doGet(req, res, next) {
        const logger = this.getRequestLogger(this.logger, req);
        const urlPath = req.path;

        //if previous middleware already determined the resource is a 404
        if(req.status === httpStatus.NOT_FOUND) {
            return this._doNotFound(logger, {
                urlPath: urlPath,
                status: httpStatus.NOT_FOUND
            });
        }
    
        const previewMode = sessionValueSwitch(req, '_preview', 'preview');
        logger.info('New %s page request', (previewMode ? 'preview' : 'live'));
    
        const modelModifier = !previewMode ? 'live' : null;
        const Page = this.dbSupport.getModel('Page', modelModifier);
        const pageQueryCacheKey = urlPath + '_' + modelModifier;
    
        //create the page query and execute it and cache it
        let findPagePromise = this.findPagePromises[pageQueryCacheKey];
        if(previewMode || !findPagePromise) {
            const filter = {
                url: urlPath
            };
            const sort = {
                status: 1,
                updatedAt: -1
            };
            const populate = 'template redirect regions.includes.plugin regions.includes.include';
            findPagePromise = Page.findOne(filter).sort(sort).populate(populate).exec();
            if(!previewMode) {
                this._setFindPagePromise(pageQueryCacheKey, findPagePromise);
            }
        }
    
        //get the page from the db!
        findPagePromise.then((page) => {
            const status = page ? page.status : httpStatus.NOT_FOUND;
    
            let pageProps = {
                page: page,
                status: status,
                previewMode: previewMode,
                urlPath: urlPath
            };
    
            //analytics. page exists and its a guest user
            if(this.analytics && page && (!req.user || req.user.role === consts.GUEST_USER.role)) {
                this._recordHit(req, page._id, logger);
            }
    
            if(status === httpStatus.OK) {
                logger.debug('Page found (%s) for %s: %s', status, urlPath, page.id);
                //each region may need to be processed, this may be async
                pageProps = this._getProcessedPageRegions(req, page, pageProps);
            } else {
                //don't cache none 200s
                delete this.findPagePromises[pageQueryCacheKey];
            }
    
            return Promise.props(pageProps);
        }).then((pageResult) => {
            const status = pageResult.status;
            if(status === httpStatus.OK) {
                //all include plugins have resolved and the page can be rendered
                this._doOk(req, res, next, logger, pageResult);
            } else if(httpStatus.REDIRECTS.indexOf(status) >= 0) {
                //handle redirects
                logger.info('Request is %s, handling redirect', status);
                this._doRedirect(req, res, next, logger, pageResult, previewMode);
            } else if(status === httpStatus.NOT_FOUND || status === httpStatus.GONE) {
                //not found or gone
                this._doNotFound(logger, pageResult);
            } else {
                //something else?
                const message = `Status ${status} is not supported for pages`;
                logger.warn(message);
                const err = new Error(message);
                err.status = 500;
                next(err);
            }
        }).catch((err) => {
            logger.debug(err);
            next(err);
        });
    }

    /**
     * Returns a map of page includes to their data (which may need to be processed by the plugin)
     */
    _getProcessedPageRegions(req, page, pageProps) {
    
        //read data for each plugin
        for(let region of page.regions) {
            for(let includeWrapper of region.includes) {
                if(includeWrapper.include) {
                    const includeId = includeWrapper.include._id.toString();
                    pageProps[includeId] = this._processInclude(req, includeWrapper, includeId, pageProps.previewMode);
                }
            }
        }
    
        return pageProps;
    }

    /**
     * Processes a single include
     */
    _processInclude(req, includeWrapper, includeId, previewMode) {
        const pluginModule = this.pluginResolver.require(includeWrapper.plugin ? includeWrapper.plugin.module : null);
        if(pluginModule) {
            const cache = includeCache.getCache();
            const urlSearch = Object.keys(req.query).sort().reduce((prev, key) => {
                return `${[prev]}${prev ? '&' : '?'}${key}=${req.query[key]}`;
            }, '');
            const includeCacheKey = includeId + urlSearch;
            return cache.get(includeCacheKey).then((result) => {
                if(result && !previewMode) {
                    return result;
                }
                const includeData = includeWrapper.include && includeWrapper.include.data ? includeWrapper.include.data : {};
                if (typeof pluginModule.process === 'function') {
                    result = Promise.try(() => {
                        return pluginModule.process(includeData, {
                            preview: previewMode,
                            req: req,
                            reqUrl: req.url,
                            reqMethod: req.method
                        });
                    }).then((val) => {
                        //don't cache in preview mode
                        return !previewMode ? cache.set(includeCacheKey, val, pluginModule.ttl) : val;
                    }).catch((err) => {
                        this.logger.warn('Could not process include for %s (%s) at %s (%s)',
                            pluginModule.name, includeId, req.url, err.message);
                        this.logger.error(err, err.message);
                        return {
                            error: err.message
                        };
                    });
                } else {
                    result = includeData;
                }
                result._id = includeId;
                return result;
            });
        }
    }

    /**
     * Resolves a page.
     */
    _doOk(req, res, next, logger, pageResult) {
        const page = pageResult.page;
    
        const pageData = {};
        pageData.site = this.site;
        pageData.page = page.toObject();
        pageData.preview = pageResult.previewMode;
        pageData.live = !pageResult.previewMode;
    
        //template properties
        pageData.template = {};
        for(let prop of page.template.properties) {
            pageData.template[prop.name] = prop.value;
        }
    
        //add missing regions from the template
        for(let templateRegion of page.template.regions) {
            const regionMissingFromPage = (regionName) => {
                return page.regions.every((region) => region.name !== regionName);
            };
    
            if(regionMissingFromPage(templateRegion.name)) {
                page.regions.push({
                    name: templateRegion.name,
                    includes: []
                });
            }
        }
    
        page.regions.forEach((region) => {
            pageData[region.name] = {
                ctx: []
            };
    
            const aggregatedViewPartials = [];
            region.includes.forEach((includeWrappper, includeIndex) => {
                const pluginModule =
                    this.pluginResolver.require(includeWrappper.plugin ? includeWrappper.plugin.module : null);
                let viewPartial, includeId;
                if(pluginModule) {
                    includeId = includeWrappper.include._id.toString();
                    pageData[region.name].ctx[includeIndex] = includeWrappper.include ? pageResult[includeId] : {};
                    viewPartial = pluginModule.viewPartial ? pluginModule.viewPartial : 'Could not resolve view partial';
                    if(pageResult.previewMode) {
                        viewPartial =
                            `<div
                                data-plugin="${pluginModule.name}"
                                data-page-id="${page._id}" 
                                data-region-name="${region.name}" 
                                data-include="${includeIndex}" 
                                data-include-id="${includeWrappper.include ? includeId : null}"
                                >\n${viewPartial}\n</div>`;
                    } else {
                        viewPartial = `<div>\n${viewPartial}\n</div>`;
                    }
                } else {
                    pageData[region.name].ctx[includeIndex] = {};
                    viewPartial = `<!-- Region: ${region.name}, Include ${includeIndex} -->`;
                }
    
                //wrap each include in a with to give it the correct context
                aggregatedViewPartials.push('{{#with ctx.[' + includeIndex + ']}}' + viewPartial + '{{/with}}');
            });
    
            //each page has its own handlebars instance and partials are cached for that instance using the url as a key
            const regionHtml =
                `<div data-page-id="${page._id}" data-region="${region.name}">${aggregatedViewPartials.join('\n')}</div>`;
            this.viewEngine.registerPartial(region.name, regionHtml, pageResult.urlPath);
        });
    
        let templateSrc = !page.template ? 'default.hbs' : page.template.src;
    
        //force an extension
        if(!/\.hbs$/.test(templateSrc)) {
            templateSrc += '.hbs';
        }
        pageData.__template = pageResult.urlPath;
        pageData.__locale = this.localeResolver(req, pageResult);
        res.render(templateSrc, pageData, (err, html) => {
            if(err) {
                logger.error(err, 'Unable to render page');
                next(err);
            } else {
                logger.info(`Page request processed OK in ${Date.now() - req.startTime} ms`);
                res.send(html);
            }
        });
    }

    /**
     * Sends redirects
     */
    _doRedirect(req, res, next, logger, pageResult, previewMode) {
        //redirects
        const redirectPage = pageResult.page.redirect;
        if(redirectPage && redirectPage.url) {
            //allows published 301s to be undone
            const cacheControl = previewMode ?  
                'no-store, no-cache, must-revalidate' : `max-age=${60 * 60}`; //1 hour
            res.header('Cache-Control', cacheControl);
            res.redirect(pageResult.status, redirectPage.url);
        } else {
            logger.warn('Page to redirect to is not set. Sending 404');
            pageResult.status = httpStatus.NOT_FOUND;
            return this._doNotFound(logger, pageResult);
        }
    }

    /**
     * Throws an error for missing pages (404 and 410)
     */
    _doNotFound(logger, pageResult) {
        //page is a 404
        const status = pageResult.status;
        logger.info(`Request is ${status}, passing to next()`);
        const errMessage  = status === httpStatus.GONE ?
            `The page, ${pageResult.urlPath}, has gone (${status})` :
            `Page not found for ${pageResult.urlPath} (${status})`;
        const err = new Error(errMessage);
        err.status = status;
        throw err;
    }

    /**
     * Records a page hit
     */
    _recordHit(req, pageId, logger) {
    
        const Hit = this.dbSupport.getModel('Hit');
        const hit = new Hit({
            page: pageId,
            ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
            referrer: req.headers['referrer'], // jshint ignore:line
            agent: req.headers['user-agent'],
            session: req.sessionID
        });
        hit.save().catch(err => {
            logger.warn(err, 'Couldn\'t save page hit');
        });
    }

    /**
     * Caches the promise for finding a page by its url. Expires after a minute for live mode
     * @private
     */
    _setFindPagePromise(key, promise) {
        this.findPagePromises[key] = promise;
    
        //simple cache expiration. nice to be a lru impl...
        setTimeout(() => {
            delete this.findPagePromises[key];
        }, FIND_PAGE_CACHE_DURATION);
    }
}

module.exports = new PageHandler();
    
/**
 * Utility to check session values set by query params (such as preview mode)
 * @param req
 * @param queryParam
 * @param sessionKey
 * @returns {*|boolean}
 */
function sessionValueSwitch(req, queryParam, sessionKey) {
    if(req.query[queryParam]) {
        if(req.user && req.user.role !== 'guest' && typeify(req.query[queryParam]) === true) {
            req.session[sessionKey] = true;
        } else if(typeify(req.query[queryParam]) === false) {
            req.session[sessionKey] = false;
        }
    }
    return req.session ? req.session[sessionKey] : false;
}