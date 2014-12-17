"use strict";

//support
var fs = require("fs");
var bunyan = require('bunyan');
var hbs = require('hbs');
var BluebirdPromise = require('bluebird');

//util
var util = require('../misc/util');
var logger =  bunyan.createLogger({ name: 'page-handler' });
var logLevel = require('../misc/log-level');
logger.level(logLevel().get());

var redirectStatuses = [ 301, 302, 303, 307 ];

var adminbarFilePromise = null;

var PageHandler = function(dbSupport, parts, site) {
    this.dbSupport = dbSupport;
    this.parts = parts;
    this.site = site;
};

module.exports = function(dbSupport, parts, site) {
    return new PageHandler(dbSupport, parts, site);
};

/**
 * Process a valid request
 */
PageHandler.prototype._doRequest = function(req, res, next) {

    var self = this;

    logger.info('Processing page request for ' + req.url);

    //turn on and off edit mode
    if(req.query._edit) {
        if(req.user && req.user.role === 'admin' && util.typeify(req.query._edit) === true) {
            logger.debug("Switching edit mode on");
            req.session.edit = true;
        } else if(util.typeify(req.query._edit) === false) {
            logger.debug("Switching edit mode off");
            req.session.edit = false;
        }
    }
    if(req.query._staging) {
        if(req.user && req.user.role === 'admin' && util.typeify(req.query._staging) === true) {
            logger.debug("Switching to staging mode");
            req.session.staging = true;
        } else if(util.typeify(req.query._staging) === false) {
            logger.debug("Switching to live mode");
            req.session.staging = false;
        }
    }
    var showAdminBar = req.user && req.user.role === 'admin';
    var editMode = typeof req.session.edit === "boolean" && req.session.edit;
    var stagingMode = typeof req.session.staging === "boolean" && req.session.staging;

    var modelModifier = !stagingMode ? 'live' : null;
    var Page = this.dbSupport.getModel('Page', modelModifier);
    var filter = {
        url: req.url
    };
    var query = Page.findOne(filter).populate('template');
    var findPage = BluebirdPromise.promisify(query.exec, query);
    findPage().then(function(page) {

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

            logger.info('Page found for ' + req.url + ': ' + page.id);

            promises.push(page);

            if(showAdminBar) {
                var readFile = BluebirdPromise.promisify(fs.readFile);
                adminbarFilePromise = adminbarFilePromise || readFile(__dirname + '/../../views/adminbar.hbs', "utf8");
                promises.push(adminbarFilePromise);
            } else {
                //push empty promise, so spread args are still right
                promises.push('');
            }

            //read data for each part
            page.regions.forEach(function (region) {
                if (region.part) {
                    var partModule = self.parts[region.part];
                    promises.push(partModule.read(region.data));
                } else {
                    promises.push(null);
                }
            });
        } else if(page.status === 404) {
            //page is a 404
            err = new Error('Page not found for ' + req.url);
            err.status = 404;
            throw err;
        } else if(page.status === 410) {
            //page is a 410 (gone)
            err = new Error('Page gone for ' + req.url);
            err.status = 410;
            throw err;
        } else if(redirectStatuses.indexOf(page.status) >= 0) {
            //page is a redirect (301, 302, 303, 307)
            query = Page.findById(page.redirect);
            findPage = BluebirdPromise.promisify(query.exec, query);
            promises.push(findPage());
        }
        return promises;
    }).spread(function() {
        var args = Array.prototype.slice.call(arguments, 0);

        var status = args.shift();
        if(status === 200) {
            var page = args.shift();
            var adminBar = args.shift();

            hbs.registerPartial('adminbar', adminBar);

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
                        content: args[i] || {},
                        edit: pageData.edit,
                        region: region.name,
                        pageId: page._id
                    };

                    var partModule = self.parts[region.part];
                    var partView = partModule.getView(editMode);
                    hbs.registerPartial(region.name, partView);
                }
            });

            var templateSrc = !page.template ? 'default.hbs' : page.template.src;
            res.render(templateSrc, pageData, function(err, html) {
                if(err) {
                    logger.error(err, 'Trying to render page, %s', req.url);
                    next(err);
                } else {
                    logger.info('Sending page for %s', req.url);
                    res.send(html);
                }
            });
        } else if(redirectStatuses.indexOf(status) >= 0) {
            //redirects
            var redirectPage = args.shift();
            res.redirect(status, redirectPage);
        } else {
            var err = new Error("Status not supported");
            err.status = status;
            next(err);
        }
    }).catch(function(err) {
        logger.error(err);
        next(err);
    });
};