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

//support
var Promise = require('bluebird'),
    psUtil = require('../support/pagespace-util');

var PublishingHandler = function() {
};

module.exports = new PublishingHandler();

PublishingHandler.prototype.init = function(support) {

    this.logger = support.logger;
    this.dbSupport = support.dbSupport;
    this.reqCount = 0;

    var self = this;
    return function(req, res, next) {
        return self.doRequest(req, res, next);
    };
};

/**
 * Process a valid request
 */
PublishingHandler.prototype.doRequest = function(req, res, next) {

    var logger = psUtil.getRequestLogger(this.logger, req, 'publishing', ++this.reqCount);

    logger.info('New publishing request');
    if(req.method === 'POST') {
        return this.doPublishDrafts(req, res, next, logger);
    } else {
        var err = new Error('Unsupported method');
        err.status = 405;
        throw err;
    }
};

PublishingHandler.prototype.doPublishDrafts = function(req, res, next, logger) {

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
    var query = DraftPage.find({ $or : orConditions}).populate('template regions.includes.plugin');
    var findPagesToPublish = Promise.promisify(query.exec, query);
    findPagesToPublish().then(function(pages) {

        var queuedDraftTemplates = {};
        var LivePage = self.dbSupport.getModel('Page', 'live');
        var LiveTemplate = self.dbSupport.getModel('Template', 'live');
        pages.forEach(function(page) {
            var templateId = null;
            if(!page.template && page.status === 200) {
                logger.warn('Attempting to publish page without a template: %s', page._id);
                return;
            } else if(page.status === 200) {
                templateId = page.template._id.toString();
            }

            //update/create live page
            var pageId = page._id.toString();
            var livePage = page.toObject();
            delete livePage._id;
            delete livePage.__v;
            delete livePage.template;

            //if not previously published, update the created date
            if(!livePage.published) {
                livePage.createdAt = Date.now();
            }
            //initial and subsequent publishing events
            livePage.updatedAt = Date.now();
            livePage.updatedBy = req.user._id;

            //no longer a draft
            livePage.draft = false;
            livePage.template = templateId;
            var saveLivePage = Promise.promisify(LivePage.update, LivePage);
            updates.push(saveLivePage({_id: pageId}, livePage, { upsert: true }));
            logger.info('Page queued to publish: %s (id=%s) @ \'%s\'', livePage.name, pageId, livePage.url);

            //page template
            if(templateId && !queuedDraftTemplates[templateId]) {
                //replicate live template
                var liveTemplate = page.template.toObject();
                delete liveTemplate._id;
                delete liveTemplate.__v;
                liveTemplate.draft = false;
                var saveLiveTemplate = Promise.promisify(LiveTemplate.update, LiveTemplate);
                updates.push(saveLiveTemplate({_id: templateId}, liveTemplate, { upsert: true }));
                queuedDraftTemplates[templateId] = true;

                logger.info('Template queued to publish: %s (id=%s)', liveTemplate.name, templateId);
            }

            //undraft page
            var saveDraftPage = Promise.promisify(page.save, page);
            page.draft = false;
            page.published = true;
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