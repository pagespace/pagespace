"use strict";

//support
var bunyan = require('bunyan');
var Bluebird = require('bluebird');

//util
var util = require('../misc/util');
var logger =  bunyan.createLogger({ name: 'publishing-handler' });
logger.level(GLOBAL.logLevel);

var PublishingHandler = function(dbSupport) {
    this.dbSupport = dbSupport;
};

module.exports = function(dbSupport) {
    return new PublishingHandler(dbSupport);
};

/**
 * Process a valid request
 */
PublishingHandler.prototype.doRequest = function(req, res, next) {

    if(req.method === 'POST') {
        return this.publishDrafts(req, res, next);
    } else {
        var err = new Error('Unsupported method');
        err.status = 405;
        throw err;
    }
};

PublishingHandler.prototype.publishDrafts = function(req, res, next) {

    var self = this;

    var draftIds = req.body;
    var orConditions = draftIds.map(function(id) {
        return {
            _id: id
        }
    });

    var DraftPage = this.dbSupport.getModel('Page');
    var query = DraftPage.find({ $or : orConditions}).populate('template regions.part');
    var findPagesToPublish = Bluebird.promisify(query.exec, query);
    findPagesToPublish().then(function(pages) {

        var updates = [];
        var LivePage = self.dbSupport.getModel('Page', 'live');
        var LiveTemplate = self.dbSupport.getModel('Template', 'live');
        pages.forEach(function(page) {

            //update/create live page
            var pageId = page._id.toString();
            var livePage = page.toObject();
            delete livePage._id;
            delete livePage.template;
            livePage.draft = false;
            var saveLivePage = Bluebird.promisify(LivePage.update, LivePage);
            updates.push(saveLivePage({_id: pageId}, livePage, { upsert: true }));

            //page template
            if(page.template.draft) {
                //replicate live template
                var templateId = page.template._id.toString();
                var liveTemplate = page.template.toObject();
                delete liveTemplate._id;
                liveTemplate.draft = false;
                var saveLiveTemplate = Bluebird.promisify(LiveTemplate.update, LiveTemplate);
                updates.push(saveLiveTemplate({_id: templateId}, liveTemplate, { upsert: true }));

                //save draft template
            }

            //undraft page
            var saveDraftPage = Bluebird.promisify(page.save, page);
            page.draft = false;
            updates.push(saveDraftPage());
        });
        return updates;
    }).spread(function() {
        res.statusCode = 204;
        res.send();
    }).catch(function(e) {
        next(new Error(e));
    });
};