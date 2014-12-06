"use strict";

//support
var bunyan = require('bunyan');
var Bluebird = require('bluebird');

//util
var logger =  bunyan.createLogger({ name: 'publishing-handler' });
var logLevel = require('../misc/log-level');
logger.level(logLevel().get());

var PublishingHandler = function(dbSupport) {
    this.dbSupport = dbSupport;
};

module.exports = function(dbSupport) {
    return new PublishingHandler(dbSupport);
};

/**
 * Process a valid request
 */
PublishingHandler.prototype._doRequest = function(req, res, next) {

    if(req.method === 'POST') {
        return this.publishDrafts(req, res, next);
    } else {
        var err = new Error('Unsupported method');
        err.status = 405;
        throw err;
    }
};

PublishingHandler.prototype.publishDrafts = function(req, res, next) {

    //TODO: deleting pages (410), updating url (new page) old-page=301+clear-data

    var self = this;

    var draftIds = req.body;

    logger.info('Publishing page IDs: [%s] ...', draftIds.join(', '));

    var orConditions = draftIds.map(function(id) {
        return {
            _id: id
        };
    });

    var updates = [];

    var DraftPage = this.dbSupport.getModel('Page');
    var query = DraftPage.find({ $or : orConditions}).populate('template regions.part');
    var findPagesToPublish = Bluebird.promisify(query.exec, query);
    findPagesToPublish().then(function(pages) {

        var queuedDraftTemplates = {};
        var LivePage = self.dbSupport.getModel('Page', 'live');
        var LiveTemplate = self.dbSupport.getModel('Template', 'live');
        pages.forEach(function(page) {
            var templateId = page.template._id.toString();

            //update/create live page
            var pageId = page._id.toString();
            var livePage = page.toObject();
            delete livePage._id;
            delete livePage.__v;
            delete livePage.template;
            livePage.draft = false;
            livePage.template = templateId;
            var saveLivePage = Bluebird.promisify(LivePage.update, LivePage);
            updates.push(saveLivePage({_id: pageId}, livePage, { upsert: true }));
            logger.info('Page queued to publish: %s (id=%s) @ \'%s\'', livePage.name, pageId, livePage.url);

            //page template
            if(!queuedDraftTemplates[templateId]) {
                //replicate live template
                var liveTemplate = page.template.toObject();
                delete liveTemplate._id;
                delete liveTemplate.__v;
                liveTemplate.draft = false;
                var saveLiveTemplate = Bluebird.promisify(LiveTemplate.update, LiveTemplate);
                updates.push(saveLiveTemplate({_id: templateId}, liveTemplate, { upsert: true }));
                queuedDraftTemplates[templateId] = true;

                logger.info('Template queued to publish: %s (id=%s)', liveTemplate.name, templateId);
            }

            //undraft page
            var saveDraftPage = Bluebird.promisify(page.save, page);
            page.draft = false;
            updates.push(saveDraftPage());
        });

        return updates;
    }).then(function() {
        logger.info('Publishing completed');
        res.statusCode = 204;
        res.send();
    }).catch(function(e) {
        logger.warn('Error during publishing, try again', e);
        next(new Error(e));
    });
};