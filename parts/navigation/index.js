'use strict';

var Promise = require('bluebird');

var findPagesPromise = null;

module.exports = {
    reset: function() {
        findPagesPromise = null;
    },
    process: function(data, support) {

        if(!findPagesPromise || !data.cache) {
            var filter = {
                root: data.root || 'primary',
                status: 200,
                useInNav: true
            };
            var query = support.PageModel.find(filter).sort({ order: 'asc'});
            findPagesPromise = Promise.promisify(query.exec, query);
        }

        return findPagesPromise().then(function(pages) {

            pages.forEach(function(page) {
                page.active = support.req.url.indexOf(page.url) > -1;
            });

            return {
                pages: pages,
                navClass: data.navClass || '',
                navItemClass: data.navItemClass || ''
            }
        });
    }
};