"use strict";

//support
var fs = require("fs");
var bunyan = require('bunyan');
var hbs = require('hbs');
var BluebirdPromise = require('bluebird');

//util
var util = require('../misc/util');
var logger =  bunyan.createLogger({ name: 'page-handler' });
logger.level(GLOBAL.logLevel);

var adminbarFilePromise = null;

var PageHandler = function(dbSupport, parts) {
    this.dbSupport = dbSupport;
    this.parts = parts;
};

module.exports = function(dbSupport, parts) {
    return new PageHandler(dbSupport, parts);
};

/**
 * Process a valid request
 */
PageHandler.prototype.doRequest = function(req, res, next) {

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

    var modelModifier = !stagingMode ? 'live' : null
    var Page = this.dbSupport.getModel('Page', modelModifier);
    var filter = {
        url: req.url
    };
    var query = Page.findOne(filter).populate('template');
    var findPage = BluebirdPromise.promisify(query.exec, query);
    findPage().then(function(page) {

        if(!page) {
            var err = new Error("Page not found for %s", req.url);
            err.status = 404;
            throw err;
        }

        logger.info('Page found for ' + req.url + ': ' + page.id);

        var promises = [];
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
        return promises;
    }).spread(function() {
        var args = Array.prototype.slice.call(arguments, 0);
        var page = args.shift();
        var adminbar = args.shift();

        hbs.registerPartial('adminbar', adminbar);

        var pageData = {};
        pageData.edit = editMode;
        pageData.preview = !editMode;
        pageData.staging = stagingMode;
        pageData.live = !stagingMode;

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
    }).catch(function(err) {
        logger.error(err);
        next();
    });
};