/**
 * Copyright © 2016, Versatile Internet
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

//deps
const 
    Promise = require('bluebird'),
    includeCache = require('../support/include-cache'),
    BaseHandler = require('./base-handler');

class PublishingHandler extends BaseHandler{
    
    get pattern() {
        return new RegExp('^/_publish/(pages)');
    }

    init(support) {
        this.logger = support.logger;
        this.dbSupport = support.dbSupport;
    }

    doPost(req, res, next) {
        const logger = this.getRequestLogger(this.logger, req);
    
        const draftIds = req.body;
    
        logger.info('Publishing page IDs: [%s] ...', draftIds.join(', '));
    
        const orConditions = draftIds.map((id) => ({
            _id: id
        }));
    
        let updates = [];
        let pageUpdateCount = 0;
        let includeUpdateCount = 0;
    
        const DraftPage = this.dbSupport.getModel('Page');
        const query = DraftPage.find({ $or : orConditions}).populate('template regions.includes.include');
        const findPagesToPublish = Promise.promisify(query.exec, { context: query });
        findPagesToPublish().then((pages) => {
    
            const queuedDraftTemplates = {};
            const LivePage = this.dbSupport.getModel('Page', 'live');
            const DraftIncludeData = this.dbSupport.getModel('Include');
            const LiveIncludeData = this.dbSupport.getModel('Include', 'live');
            const LiveTemplate = this.dbSupport.getModel('Template', 'live');
            for(let page of pages) {
                if(!page.draft) {
                    logger.warn('Aborted publishing page %s. It is not a draft', page._id);
                    return;
                }
    
                let templateId = null;
                if(!page.template) {
                    logger.warn('Attempting to publish page without a template: %s', page._id);
                    return;
                } else if(page.status === 200) {
                    templateId = page.template._id.toString();
                }
    
                //update/create live page
                const pageId = page._id.toString();
                const livePage = page.toObject();
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
                const saveLivePage = Promise.promisify(LivePage.update, { context: LivePage });
                updates.push(saveLivePage({_id: pageId}, livePage, { upsert: true }));
                logger.info('Page queued to publish: %s (id=%s) @ \'%s\'', livePage.name, pageId, livePage.url);
    
                //page template
                if(templateId && !queuedDraftTemplates[templateId]) {
                    //replicate live template
                    const liveTemplate = page.template.toObject();
                    delete liveTemplate._id;
                    delete liveTemplate.__v;
                    liveTemplate.draft = false;
                    const saveLiveTemplate = Promise.promisify(LiveTemplate.update, { context: LiveTemplate});
                    updates.push(saveLiveTemplate({_id: templateId}, liveTemplate, { upsert: true }));
                    queuedDraftTemplates[templateId] = true;
    
                    logger.info(`Template queued to publish: ${liveTemplate.name} (id=${templateId})`);
                }
    
                //page data
                let saveDraftIncludeData;
                let saveLiveIncludeData;
                for(let region of page.regions) {
                    for(let includeWrapper of region.includes) {
                        if(includeWrapper.include && includeWrapper.include.draft) {
                            const includeId = includeWrapper.include._id.toString();
                            const includeUpdate = includeWrapper.include.toObject();
                            includeUpdate.draft = false;
                            delete includeUpdate._id;
                            delete includeUpdate.__v;
                            saveDraftIncludeData = Promise.promisify(DraftIncludeData.update, { context: DraftIncludeData});
                            saveLiveIncludeData = Promise.promisify(LiveIncludeData.update, { context: LiveIncludeData });
                            updates.push(saveDraftIncludeData({_id: includeId}, includeUpdate, { upsert: true }));
                            updates.push(saveLiveIncludeData({_id: includeId}, includeUpdate, { upsert: true }));
                            includeCache.getCache().del(includeId);
                            includeUpdateCount++;
    
                            logger.info(`Include data queued to publish (id=${includeId})`);
                        }
                    }
                }
    
                //undraft page
                const saveDraftPage = Promise.promisify(page.save, { context: page });
                page.draft = false;
                page.published = true;
                updates.push(saveDraftPage());
                pageUpdateCount++;
            }
    
            return updates;
        }).then((updates) => {
            logger.info(`Publishing completed. Published ${pageUpdateCount} pages and ${includeUpdateCount} includes`);
            res.status(200);
            res.json({
                message: `Published ${pageUpdateCount} pages and ${includeUpdateCount} includes`,
                publishCount: updates.length
            });
        }).catch((err) => {
            logger.warn('Error during publishing, try again', err);
            next(new Error(err));
        });
    }
}

module.exports = new PublishingHandler();

