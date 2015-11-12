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

//support
var Promise = require('bluebird'),
    util = require('util'),
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
    var numPageUpdates = 0;
    var numDataUpdates = 0;

    var DraftPage = this.dbSupport.getModel('Page');
    var query = DraftPage.find({ $or : orConditions}).populate('template regions.includes.data');
    var findPagesToPublish = Promise.promisify(query.exec, query);
    findPagesToPublish().then(function(pages) {

        var queuedDraftTemplates = {};
        var LivePage = self.dbSupport.getModel('Page', 'live');
        var DraftIncludeData = self.dbSupport.getModel('Data');
        var LiveIncludeData = self.dbSupport.getModel('Data', 'live');
        var LiveTemplate = self.dbSupport.getModel('Template', 'live');
        pages.forEach(function(page) {

            if(!page.draft) {
                logger.warn('Aborted publishing page %s. It is not a draft', page._id);
                return;
            }

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

            //page data
            var saveDraftIncludeData;
            var saveLiveIncludeData;
            page.regions.forEach(function(region) {
                region.includes.forEach(function(include) {
                    if(include.data && include.data.draft) {
                        var dataId = include.data._id.toString();
                        var dataUpdate = include.data.toObject();
                        dataUpdate.draft = false;
                        delete dataUpdate._id;
                        delete dataUpdate.__v;
                        saveDraftIncludeData = Promise.promisify(DraftIncludeData.update, DraftIncludeData);
                        saveLiveIncludeData = Promise.promisify(LiveIncludeData.update, LiveIncludeData);
                        updates.push(saveDraftIncludeData({_id: dataId}, dataUpdate, { upsert: true }));
                        updates.push(saveLiveIncludeData({_id: dataId}, dataUpdate, { upsert: true }));
                        numDataUpdates++;

                        logger.info('Include dat queued to publish (id=%s)', dataId);
                    }
                });
            });

            //undraft page
            var saveDraftPage = Promise.promisify(page.save, page);
            page.draft = false;
            page.published = true;
            updates.push(saveDraftPage());
            numPageUpdates++;
        });

        return updates;
    }).then(function(updates) {
        logger.info('Publishing completed.Published %s pages and %s data includes', numPageUpdates, numDataUpdates);
        res.status(200);
        res.json({
            message: util.format('Published %s pages and %s data includes', numPageUpdates, numDataUpdates),
            publishCount: updates.length
        });
    }).catch(function(e) {
        logger.warn('Error during publishing, try again', e);
        next(new Error(e));
    });
};