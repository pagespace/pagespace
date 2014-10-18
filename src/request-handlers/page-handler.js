"use strict";

//support
var bunyan = require('bunyan');
var hbs = require('hbs');

//util
var util = require('../misc/util');
var logger =  bunyan.createLogger({ name: 'page-handler' });
logger.level('debug');

var PageHandler = function(pageResolver, parts) {
    this.pageResolver = pageResolver;
    this.parts = parts;
};

module.exports = function(pageResolver, parts) {
    return new PageHandler(pageResolver, parts);
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

    self.pageResolver.findPage(req.url).then(function(page) {

        logger.info('Page found for ' + req.url + ': ' + page.id);

        var pageData = {};
        page.regions.forEach(function(region) {
            if(region.partInstance) {
                //TODO: region.part is an id. need to populate it first
                logger.info(region.partInstance);

                var partModule = self.parts[region.partInstance.part];

                var editMode = typeof req.session.edit === "boolean" && req.session.edit;

                pageData.edit = editMode;
                pageData.title = page.name;
                pageData[region.region] =  {
                    id: region.partInstance._id,
                    edit: editMode,
                    data: partModule ? partModule.read(region.partInstance.data) : {}
                };

                var partView = partModule.getView(editMode);
                hbs.registerPartial(region.region, partView);
            }
        });

        var templateSrc = !page.template ? 'default.hbs' : page.template.src;
        return res.render(templateSrc, pageData, function(err, html) {
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