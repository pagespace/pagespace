'use strict';

//support
var fs = require('fs');
var url = require('url');
var BluebirdPromise = require('bluebird');

//util
var util = require('util');
var path = require('path');
var psUtil = require('../misc/util');

var redirectStatuses = [ 301, 302, 303, 307 ];

var adminbarFilePromise = null;

var PageHandler = function(support) {
    this.viewEngine = support.viewEngine;
    this.dbSupport = support.dbSupport;
    this.parts = support.parts;
    this.site = support.site;
    this.logger = support.logger.child({module: 'page-handler'});
    this.partResolver = support.partResolver;
};

module.exports = function(support) {
    return new PageHandler(support);
};

/**
 * Process a valid request
 */
PageHandler.prototype._doRequest = function(req, res, next) {

    var self = this;
    var logger = this.logger;

    var urlPath = url.parse(req.url).pathname;

    logger.info('Processing page request for %s', urlPath);

    function sessionValueSwitch(req, queryParam, sessionKey) {
        if(req.query[queryParam]) {
            if(req.user && req.user.role === 'admin' && psUtil.typeify(req.query[queryParam]) === true) {
                logger.debug('Switching %s on', sessionKey);
                req.session[sessionKey] = true;
            } else if(psUtil.typeify(req.query[queryParam]) === false) {
                logger.debug('Switching %s off', sessionKey);
                req.session[sessionKey] = false;
            }
        }
        return req.session[sessionKey] || false;
    }

    var showAdminBar = req.user && req.user.role === 'admin';
    var editMode = sessionValueSwitch(req, '_edit', 'edit');
    var stagingMode = sessionValueSwitch(req, '_staging', 'staging');

    var modelModifier = !stagingMode ? 'live' : null;
    var Page = this.dbSupport.getModel('Page', modelModifier);
    var filter = {
        url: urlPath
    };
    var query = Page.findOne(filter).populate('template redirect regions.part');
    var findPage = BluebirdPromise.promisify(query.exec, query);
    findPage().then(function(page) {

        logger.debug('Page retrieved');
        logger.debug(util.inspect(page));

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

            logger.info('Page found for %s: %s', urlPath, page.id);

            promises.push(page);

            if(showAdminBar) {
                var readFile = BluebirdPromise.promisify(fs.readFile);
                var adminBarLocation = path.join(__dirname, '/../../views/adminbar.hbs');
                logger.debug('Showing admin bar (from: %s) ', adminBarLocation);
                adminbarFilePromise = adminbarFilePromise || readFile(adminBarLocation, "utf8");
                promises.push(adminbarFilePromise);
            } else {
                //push empty promise, so spread args are still right
                promises.push('');
            }

            //read data for each part
            page.regions.forEach(function (region) {
                var partModule = self.partResolver.require(region.part.module);
                if(partModule && typeof partModule.process === 'function') {
                    promises.push(partModule.process(region.data));
                } else {
                    promises.push(null);
                }
            });
        } else if(page.status === 404) {
            //page is a 404
            err = new Error('Page not found for ' + urlPath);
            err.status = 404;
            throw err;
        } else if(page.status === 410) {
            //page is a 410 (gone)
            err = new Error('Page gone for ' + urlPath);
            err.status = 410;
            throw err;
        } else if(redirectStatuses.indexOf(page.status) >= 0) {
            //page is a redirect (301, 302, 303, 307)
            promises.push(page.redirect);
        }
        return promises;
    }).spread(function() {
        var err;
        var args = Array.prototype.slice.call(arguments, 0);
        var status = args.shift();
        if(status === 200) {
            var page = args.shift();
            var adminBar = args.shift();

            self.viewEngine.registerPartial('adminbar', adminBar);

            var pageData = {};
            pageData.site = self.site.toObject();
            pageData.page = page.toObject();
            pageData.edit = editMode;
            pageData.preview = !editMode;
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

                    var partModule = self.parts[region.part];
                    self.viewEngine.registerPartial(region.name, partModule.viewPartial || '');
                }
            });

            var templateSrc = !page.template ? 'default.hbs' : page.template.src;

            //force an extension
            if(!/\.hbs$/.test(templateSrc)) {
                templateSrc += '.hbs';
            }
            res.render(templateSrc, pageData, function(err, html) {
                if(err) {
                    logger.error(err, 'Trying to render page, %s', urlPath);
                    next(err);
                } else {
                    logger.info('Sending page for %s', urlPath);
                    res.send(html);
                }
                //clean up
                page.regions.forEach(function (region, i) {
                    if (region.part) {
                        self.viewEngine.unregisterPartial(region.name);
                    }
                });
            });
        } else if(redirectStatuses.indexOf(status) >= 0) {
            //redirects
            var redirectPage = args.shift();
            if(redirectPage && redirectPage.url) {
                res.redirect(status, redirectPage.url);
            } else {
                err = new Error('Page not found for ' + urlPath);
                err.status = 404;
                throw err;
            }

        } else {
            err = new Error("Status not supported");
            err.status = status;
            next(err);
        }
    }).catch(function(err) {
        logger.error(err);
        next(err);
    });
};