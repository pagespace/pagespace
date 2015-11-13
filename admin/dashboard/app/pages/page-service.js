(function() {
    var adminApp = angular.module('adminApp');
    adminApp.factory('pageService', function($http) {

        function PageService() {
            this.pageCache = [];
        }
        PageService.prototype.getPages = function(filter) {
            var self = this;

            var queryKeyValPairs = [];
            if(typeof filter === 'object') {
                for(var key in filter) {
                    if(filter.hasOwnProperty(key)) {
                        queryKeyValPairs.push(encodeURIComponent(key) + '=' + encodeURIComponent(filter[key]));
                    }
                }
            }

            var path = '/_api/pages';
            var url = queryKeyValPairs.length ? path + '?' + queryKeyValPairs.join('&') : path;
            var promise = $http.get(url);
            promise.success(function(pages) {
                self.pageCache = pages;
            });
            return promise;
        };
        PageService.prototype.getPage = function(pageId) {
            return $http.get('/_api/pages/' + pageId);
        };

        PageService.prototype.createPage = function(pageData) {

            if(!pageData.url) {
                pageData.url = this.generateUrl(pageData);
            }

            return $http.post('/_api/pages', pageData);
        };

        PageService.prototype.deletePage = function(page) {
            if(page.published) {
                var pageData = {
                    status: page.status
                };

                if(page.redirect) {
                    pageData.redirect = page.redirect._id;
                }

                //live pages are updated to be gone
                return $http.put('/_api/pages/' + page._id, pageData);
            } else {
                //pages which have never been published can be hard deleted
                return $http.delete('/_api/pages/' + page._id);
            }
        };

        PageService.prototype.updatePage = function(pageId, pageData) {
            return $http.put('/_api/pages/' + pageId, pageData);
        };

        PageService.prototype.createIncludeData = function(config) {
            return $http.post('/_api/datas', {
                config: config
            });
        };

        PageService.prototype.swapIncludes = function(page, regionName, includeOne, includeTwo) {

            //find the region
            var region = page.regions.filter(function(region) {
                return region.name === regionName;
            })[0];

            if(region) {
                var temp = region.includes[includeOne];
                region.includes[includeOne] = region.includes[includeTwo];
                region.includes[includeTwo] = temp;
            }

            return page;
        };

        PageService.prototype.generateUrl = function(page, parent) {

            parent = parent || page.parent;

            var parentUrlPart = null;
            if(parent && parent.url) {
                parentUrlPart = parent.url;
            }
            return (parentUrlPart || '') + '/' + slugify(page.name);
        };

        PageService.prototype.removeInclude = function(page, regionIndex, includeIndex) {

            var i;
            //convert region name to index
            for(i = 0; i < page.regions.length && typeof regionIndex === 'string'; i++) {
                if(page.regions[i].name === regionIndex) {
                    regionIndex = i;
                }
            }

            if(typeof regionIndex === 'number') {
                for(i = page.regions[regionIndex].includes.length - 1; i >= 0; i--) {
                    if(i === includeIndex) {
                        page.regions[regionIndex].includes.splice(i, 1);
                    }
                }
            } else {
                var msg = 'Couldn\'t determine the region that the include to remove belongs to (' + regionIndex + ')';
                throw new Error(msg);
            }

            return page;
        };

        PageService.prototype.depopulatePage = function(page) {

            delete page.createdBy;
            delete page.updatedBy;
            delete page.createdAt;
            delete page.updatedAt;
            delete page.basePage;
            if(page.template && page.template._id) {
                page.template = page.template._id;
            }
            if(page.parent && page.parent._id) {
                page.parent = page.parent._id;
            }
            if(page.redirect && page.redirect._id) {
                page.redirect = page.redirect._id;
            }
            page.regions = page.regions.filter(function(region) {
                return typeof region === 'object';
            }).map(function(region) {
                region.includes = region.includes.map(function(include) {

                    if(include.plugin && include.plugin._id) {
                        include.plugin = include.plugin._id;
                    }
                    if(include.data && include.data._id) {
                        include.data = include.data._id;
                    }
                    return include;
                });

                return region;
            });
            return page;
        };

        return new PageService();
    });

    function slugify(str) {

        str = str || '';
        str = str.replace(/^\s+|\s+$/g, ''); // trim
        str = str.toLowerCase();

        // remove accents, swap ñ for n, etc
        var from = 'ãàáäâẽèéëêìíïîõòóöôùúüûñç·/_,:;';
        var to   = 'aaaaaeeeeeiiiiooooouuuunc------';
        for (var i=0, l=from.length ; i<l ; i++) {
            str = str.replace(new RegExp(from.charAt(i), 'g'), to.charAt(i));
        }

        str = str.replace(/[^a-z0-9 -]/g, '') // remove invalid chars
            .replace(/\s+/g, '-') // collapse whitespace and replace by -
            .replace(/-+/g, '-'); // collapse dashes

        return str;
    }

})();


