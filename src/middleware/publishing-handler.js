'use strict';

//deps
const
    includeCache = require('../support/include-cache'),
    BaseHandler = require('./base-handler');

class PublishingHandler extends BaseHandler {

    get pattern() {
        return new RegExp('^/_publish/(pages|revert)');
    }

    init(support) {
        this.logger = support.logger;
        this.dbSupport = support.dbSupport;
    }

    doPost(req, res, next) {
        const logger = this.getRequestLogger(this.logger, req);

        const draftIds = req.body;

        if(!draftIds || !draftIds.length) {
            const err = new Error('No page id\'s to publish');
            err.status = 400;
            next(err);
        }

        logger.info('Publishing page IDs: [%s] ...', draftIds.join(', '));

        const orConditions = draftIds.map(id => ({ _id: id }));

        const DraftPage = this.dbSupport.getModel('Page');
        DraftPage.find({ $or : orConditions}).populate('template regions.includes.include').exec().then((pages) => {
            let updates = [];
            let pageUpdateCount = 0;
            let includeUpdateCount = 0;
    
            const updatedTemplates = {}, updatedIncludes = {};
            const LivePage = this.dbSupport.getModel('Page', 'live');
            const DraftIncludeData = this.dbSupport.getModel('Include');
            const LiveIncludeData = this.dbSupport.getModel('Include', 'live');
            const LiveTemplate = this.dbSupport.getModel('Template', 'live');
            for(let page of pages) {
                if(!page.draft) {
                    logger.warn(`Aborted publishing page ${page._id}. It is not a draft`);
                    continue;
                }
    
                let templateId = null;
                if(page.status === 200 && !page.template) {
                    logger.warn(`Attempting to publish page without a template: ${page._id}`);
                    continue;
                } else if(page.template) {
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
    
                //remove old redirects
                if(!page.redirect && livePage.redirect) {
                    delete livePage.redirect;
                }
    
    
                //no longer a draft
                livePage.draft = false;
                livePage.published = true;
                livePage.template = templateId;
                updates.push(LivePage.update({_id: pageId}, livePage, { upsert: true }));
                logger.info(`Page queued to publish: ${livePage.name} (id=${pageId}) @ '${livePage.url}'`);
    
                //page template
                if(templateId && !updatedTemplates[templateId]) {
                    //replicate live template
                    const liveTemplate = page.template.toObject();
                    delete liveTemplate._id;
                    delete liveTemplate.__v;
                    liveTemplate.draft = false;
                    updates.push(LiveTemplate.update({_id: templateId}, liveTemplate, { upsert: true, overwrite: true }));
                    updatedTemplates[templateId] = true;
    
                    logger.info(`Template queued to publish: ${liveTemplate.name} (id=${templateId})`);
                }
    
                //includes
                for(let region of page.regions) {
                    for(let includeWrapper of region.includes) {
                        const includeId = includeWrapper.include && includeWrapper.include._id ?
                            includeWrapper.include._id.toString() : null;
                        if(includeId && includeWrapper.include.draft && !updatedIncludes[includeId]) {
                            const includeUpdate = includeWrapper.include.toObject();
                            includeUpdate.draft = false;
                            delete includeUpdate._id;
                            delete includeUpdate.__v;
                            updates.push(DraftIncludeData.update({_id: includeId}, includeUpdate, { upsert: true }));
                            updates.push(LiveIncludeData.update({_id: includeId}, includeUpdate, { upsert: true }));
                            includeCache.getCache().del(includeId);
                            updatedIncludes[includeId] = true;
                            includeUpdateCount++;
    
                            logger.info(`Include data queued to publish (id=${includeId})`);
                        }
                    }
                }
    
                //undraft page
                page.draft = false;
                page.published = true;
                updates.push(page.save());
                pageUpdateCount++;
            }
    
            return Promise.all([ pageUpdateCount, includeUpdateCount ].concat(updates));
        }).then(results => {
            const pageUpdateCount = results[0];
            const includeUpdateCount = results[1];
            logger.info(`Publishing completed. Published ${pageUpdateCount} pages and ${includeUpdateCount} includes`);
            res.status(200);
            res.json({
                message: `Published ${pageUpdateCount} pages and ${includeUpdateCount} includes`,
                publishCount: results.length - 2
            });
        }).catch(err => {
            logger.warn(err, 'Error during publishing, try again');
            next(err);
        });
    }

    doPut(req, res, next) {
        const logger = this.getRequestLogger(this.logger, req);
        var pageId = req.body.pageId;

        const LivePage = this.dbSupport.getModel('Page', 'live');
        LivePage.findById(pageId).exec().then((livePage) => {
            logger.info('Reverting draft page %s (id=%s)...', livePage.name, livePage._id);
            const newDraftPage = livePage.toObject();
            delete newDraftPage._id;
            delete newDraftPage.__v;
            newDraftPage.draft = false;
            const DraftPage = this.dbSupport.getModel('Page');
            return DraftPage.findByIdAndUpdate(pageId, newDraftPage, { overwrite: true }).exec();
        }).then(() => {
                logger.info('Draft page successfully reverted');
            res.status(204);
            res.send();
        }).catch(err => {
                logger.warn(err, 'Error reverting page');
            next(err);
        });
    }
}

module.exports = new PublishingHandler();