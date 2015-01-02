'use strict';

var BluebirdPromise = require('bluebird');
var util = require('util');

module.exports = {
    viewPartial: null,
    init: function(viewPartial) {
        this.viewPartial = viewPartial;
    },
    process: function(data, support) {

        var templateData = {
            separatorClass: data.separatorClass || ''
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
        var findPage = BluebirdPromise.promisify(query.exec, query);
        return findPage().then(function(pages) {
            templateData.htmlItems = pages.reduce(function(html, page) {
                for(var i = 0; i < page.regions.length; i++) {
                    var region = page.regions[i];
                    if(region.name === regionName && typeof region.data === 'string') {
                        html.push(page.regions[i].data);
                    }
                }
                return html;
            }, []);

            return templateData;
        });
    }
};