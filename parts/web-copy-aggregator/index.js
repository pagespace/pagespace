'use strict';

var Promise = require('bluebird');
var util = require('util');

module.exports = {
    viewPartial: null,
    init: function(viewPartial) {
        this.viewPartial = viewPartial;
    },
    process: function(data, support) {

        var templateData = {
            wrapperClass: data.wrapperClass || ''
        };

        var regionName = data.regionName || null;
        if(!regionName) {
            templateData.htmlItems = [ '<p>No part name to aggregate specified</p>' ];
            return templateData;
        }

        //configure query
        var sortField = data.sort || '-createdAt';
        var pageQuery = data.query || {};
        pageQuery.status = pageQuery.status || 200;
        if(data.expired) {
            pageQuery.expiresAt = {"$lte": Date.now() }
        } else if(data.unexpired) {
            pageQuery.expiresAt = {"$gte": Date.now() }
        }

        //query pages
        var query = support.PageModel.find(pageQuery).sort(sortField);
        var findPage = Promise.promisify(query.exec, query);
        return findPage().then(function(pages) {
            templateData.htmlItems = pages.reduce(function(html, page) {
                for(var i = 0; i < page.regions.length; i++) {
                    var region = page.regions[i];
                    if(region.name === regionName && region.data && typeof region.data.html  === 'string') {
                        html.push(page.regions[i].data.html);
                    }
                }
                return html;
            }, []);

            if(templateData.htmlItems.length === 0) {
                var defaultEmptyMessage =
                    '<!-- There are no items to display (use "emptyHtml" to customize this message-->';
                templateData.htmlItems.push([ data.emptyHtml || defaultEmptyMessage]);
            }

            return templateData;
        }).catch(function(err) {
            templateData.htmlItems.push([ err ]);
        });
    }
};