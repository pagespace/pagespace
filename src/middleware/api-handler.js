'use strict';

//deps
const
    handlebars = require('handlebars'),
    mongoSanitize = require('mongo-sanitize'),
    typeify = require('../support/typeify'),
    BaseHandler = require('./base-handler');

//maps model ur namel parts to model names
const urlToModelMap = {
    sites: 'Site',
    pages: 'Page',
    plugins: 'Plugin',
    includes: 'Include',
    templates:'Template',
    users: 'User',
    media: 'Media',
    macros: 'Macro'
};

//fields to auto populate when making queries to these model names (the keys)
const populationsMap = {
    Site: '',
    Page: 'parent template basePage regions.includes.plugin regions.includes.include redirect createdBy updatedBy image',
    Plugin: '',
    Include: '',
    Template: 'regions.includes.plugin',
    User: '',
    Media: '',
    Macro: 'parent basePage template includes.plugin'
};

class ApiHandler extends BaseHandler {
    
    get pattern() {
        return new RegExp('^/_api/(sites|pages|plugins|macros|includes|templates|users|media)/?(.*)');
    }

    init(support) {
        this.logger = support.logger;
        this.dbSupport = support.dbSupport;
    }

    parseApiInfo(req) {
        const apiInfo = this.pattern.exec(req.path);
        if(!apiInfo) {
            const err = new Error('Unable to parse api info from request url');
            err.status = 400;
            throw err;
        }
        return {
            apiType: apiInfo[1],
            itemId: apiInfo[2]
        };
    }

    getModel(apiType) {
        const modelName = urlToModelMap[apiType];
        return this.dbSupport.getModel(modelName) || null;
    }

    doGet(req, res, next) {
        const logger = this.getRequestLogger(this.logger, req);
        const apiInfo = this.parseApiInfo(req);
        const itemId = apiInfo.itemId;
        const Model = this.getModel(apiInfo.apiType);
    
        //clear props not to write to db
        delete req.body._id;
        delete req.body.__v;
    
        const filter = {};
        if (itemId) {
            filter._id = itemId;
            logger.debug('Searching for items by id [%s]: %s', itemId, Model.modelName);
        } else {
            logger.debug('Searching for items in model: %s', Model.modelName);
        }
    
        //create a filter from the query string
        for (let p in req.query) {
            //use __ prefix to stop special query params being included in filter
            if (req.query.hasOwnProperty(p) && p.indexOf('__') !== 0) {
                filter[p] = parseQueryExpression(typeify(req.query[p]), logger);
            }
        }
    
        const populations = typeify(req.query.__nopop) ? '' : populationsMap[Model.modelName];
        Model.find(filter, '-__v').populate(populations).sort('-createdAt').exec().then(results => {
            logger.info('API request OK in %s ms', Date.now() - req.startTime);
            results = itemId ? results[0] : results;
            if (req.headers.accept && req.headers.accept.indexOf('application/json') === -1) {
                const modelName = Model.modelName;
                const resultName = results.name || '';
                const titleItemId = itemId || 'all';
                const htmlBody = htmlStringify(results);
                const html = `<title>${modelName}: ${resultName}, ${titleItemId}</title>\n${htmlBody}`;
                res.send(html, {
                    'Content-Type': 'text/html'
                }, 200);
            } else {
                res.json(results);
            }
        }).catch(err => {
            logger.error(err, 'Error trying API GET for %s', Model.modelName);
            next(err);
        });
    }

    doPost(req, res, next) {
        const logger = this.getRequestLogger(this.logger, req);
        const apiInfo = this.parseApiInfo(req);
        const itemId = apiInfo.itemId;
        const Model = this.getModel(apiInfo.apiType);
    
        //clear props not to write to db
        delete req.body._id;
        delete req.body.__v;
    
        if (itemId) {
            const message = `Cannot POST for this url. It should not contain an id [${itemId}]`;
            logger.warn(message);
            const err = new Error(message);
            err.status = 400;
            next(err);
        } else {
            logger.info('Creating new %s', Model.modelName);
            logger.debug('Creating new model with data: ');
            logger.debug(req.body);
    
            const docData = req.body;
            const model = new Model(docData);
            model.createdBy = req.user._id;
            model.save().then((model) => {
                logger.info('API POST OK in %s ms', Date.now() - req.startTime);
                res.status(201);
                res.json(model);
            }).catch(err => {
                if(err.name === 'CastError' || err.name === 'ValidationError') {
                    //it was the client's fault
                    err.status = 400;
                }
                logger.error(err, 'Trying to save for API POST for %s', Model.name);
                next(err);
            });
        }
    }

    doPut(req, res, next) {
        const logger = this.getRequestLogger(this.logger, req);
        const apiInfo = this.parseApiInfo(req);
        const itemId = apiInfo.itemId;
        const Model = this.getModel(apiInfo.apiType);
    
        //clear props not to write to db
        delete req.body._id;
        delete req.body.__v;
    
        if (!itemId) {
            const message = 'Cannot PUT for this url. It should contain an id';
            logger.warn(message);
            const err = new Error(message);
            err.status = 400;
            next(err);
        } else {
            logger.info('Updating %s with id [%s]', Model.modelName, itemId);
            logger.debug('Updating model with data: ');
            const docData = req.body;
            docData.updatedBy = req.user._id;
            docData.draft = true;
            logger.debug(req.body);
            Model.findOneAndUpdate({_id: itemId}, docData, { 'new': true }).exec().then( (doc) => {
                logger.info('API PUT OK in %s ms', Date.now() - req.startTime);
                res.json(doc);
            }).catch(err => {
                if(err.name === 'CastError' || err.name === 'ValidationError') {
                    //it was the client's fault
                    err.status = 400;
                }
                logger.error(err, 'Trying to update for API PUT for %s', Model.modelName);
                next(err);
            });
        }
    }
    
    doDelete(req, res, next) {
        const logger = this.getRequestLogger(this.logger, req);
        const apiInfo = this.parseApiInfo(req);
        const itemId = apiInfo.itemId;
        const Model = this.getModel(apiInfo.apiType);
    
        if (!itemId) {
            const message = 'Cannot delete for this url. It should contain an id';
            logger.warn(message);
            const err = new Error(message);
            err.status = 400;
            next(err);
        } else {
            logger.info('Removing %s with id [%s]', Model.modelName, itemId);
            Model.findByIdAndRemove(itemId).exec().then(() => {
                logger.info('API DELETE OK in %s ms', Date.now() - req.startTime);
                res.status(204);
                res.send();
            }).catch(err => {
                if(err.name === 'CastError') {
                    //it was the client's fault
                    err.status = 400;
                }
                logger.error(err, 'Trying to do API DELETE for %s', Model.modelName);
                next(err);
            });
        }
    }
}

const CONTAINS_REGEX = /^contains\((.+)\)$/;

function parseQueryExpression(str, logger) {
    
    //allow clients to safely use $elemMatch queries
    if(CONTAINS_REGEX.test(str)) {
        try {
            return { $elemMatch: mongoSanitize(JSON.parse(CONTAINS_REGEX.exec(str)[1])) };
        } catch(err) {
            logger.warn(`Cannot parse query expression: ${str}`);
        }
    }
    return str;
}

function htmlStringify(obj) {
    const html =
        `<body style="background: #fff; padding: 0;">
            <link rel="stylesheet" href="/_static/dashboard/support/highlightjs/github-gist.css">
            <script src="/_static/dashboard/support/highlightjs/highlight.pack.js"></script>
            <script>hljs.initHighlightingOnLoad();</script>
            <pre><code class="json">${handlebars.escapeExpression(JSON.stringify(obj, null, 4))}</code></pre>
        </body>`;
    return html;
}

module.exports = new ApiHandler();