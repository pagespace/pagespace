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
            return $http.get(url).then(function(res) {
                self.pageCache = res.data;
                return self.pageCache;
            }).catch(res => res.data);
        };
        PageService.prototype.getPage = function(pageId) {
            return $http.get('/_api/pages/' + pageId).then(res => res.data).catch(res => res.data);
        };

        PageService.prototype.createPage = function(pageData) {

            if(!pageData.url) {
                pageData.url = this.generateUrl(pageData);
            }

            return $http.post('/_api/pages', pageData).then(res => res.data).catch(res => res.data);
        };

        PageService.prototype.deletePage = function(page) {
            var promise;
            if(page.published) {
                var pageData = {
                    status: page.status
                };

                if(page.redirect) {
                    pageData.redirect = page.redirect._id;
                }

                //live pages are updated to be gone
                promise = $http.put('/_api/pages/' + page._id, pageData);
            } else {
                //pages which have never been published can be hard deleted
                promise = $http.delete('/_api/pages/' + page._id);
            }
            return promise.then(res => res.data).catch(res => res.data);
        };

        PageService.prototype.updatePage = function(pageId, pageData) {
            return $http.put('/_api/pages/' + pageId, pageData).then(res => res.data).catch(res => res.data);
        };

        PageService.prototype.createIncludeData = function(plugin) {

            var includeData = {};

            var schemaProps = plugin.config.schema.properties || {};
            for(var name in schemaProps) {
                if(schemaProps.hasOwnProperty(name)) {
                    includeData[name] =
                        typeof schemaProps[name].default !== 'undefined' ? schemaProps[name].default : null;
                }
            }

            return $http.post('/_api/includes', {
                data: includeData
            }).then(res => {
                return res.data;
            }).catch(res => {res.data});
        };
        
        PageService.prototype.getRegionIndex = function(page, regionName) {
            //map region name to index
            var regionIndex = null;
            for(var i = 0; i < page.regions.length && regionIndex === null; i++) {
                if(page.regions[i].name === regionName) {
                    regionIndex = i;
                }
            }
            return regionIndex;
        };
        
        PageService.prototype.addRegion = function(page, regionName) {
            page.regions.push({
                name: regionName,
                includes: []
            });
            return page.regions.length - 1;    
        };
        
        PageService.prototype.addIncludeToPage = function(page, regionIndex, plugin, include) {
            page.regions[regionIndex].includes.push({
                plugin: plugin,
                include: include._id
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

            //remove that index from the regions array
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

            if(page.template && page.template._id) {
                page.template = page.template._id;
            }
            if(page.parent && page.parent._id) {
                page.parent = page.parent._id;
            }
            if(page.basePage && page.basePage._id) {
                page.basePage = page.basePage._id;
            }
            if(page.redirect && page.redirect._id) {
                page.redirect = page.redirect._id;
            }
            page.regions = page.regions.filter(function(region) {
                return typeof region === 'object';
            }).map(function(region) {
                region.includes = region.includes.map(function(includeWrapper) {

                    if(includeWrapper.plugin && includeWrapper.plugin._id) {
                        includeWrapper.plugin = includeWrapper.plugin._id;
                    }
                    if(includeWrapper.include && includeWrapper.include._id) {
                        includeWrapper.include = includeWrapper.include._id;
                    }
                    return includeWrapper;
                });

                return region;
            });
            return page;
        };

        PageService.prototype.synchronizeWithBasePage = function(page) {
            function getRegionFromPage(page, regionName) {
                return page.regions.filter(function(region) {
                        return region.name === regionName;
                    })[0] || null;
            }
            function containsInclude(region, includeToFind) {
                return region.includes.some(function(include) {
                    return include._id === includeToFind._id;
                });
            }
            //get basepage from id value
            var syncResults = [];
            page.template.regions.forEach(function(templateRegion) {
                var syncResult = {
                    region: templateRegion.name,
                    removedCount: 0,
                    sharedCount: 0
                };
                var sharing = !!templateRegion.sharing;
                var pageRegion = getRegionFromPage(page, templateRegion.name);
                if(!pageRegion) {
                    pageRegion = {
                        name: templateRegion.name,
                        includes: []
                    };
                    page.regions.push(pageRegion);
                }
                var baseRegion = getRegionFromPage(page.basePage, templateRegion.name);
                if(baseRegion) {
                    var startCount = pageRegion.includes ? pageRegion.includes.length : 0;
                    //add additional non-shared includes at the end
                    baseRegion.includes.forEach(function(baseInclude) {
                        if(sharing && !containsInclude(pageRegion, baseInclude)) {
                            pageRegion.includes.push(baseInclude);
                        }
                    });
                    syncResult.sharedCount = pageRegion.includes.length - startCount;
                }
                syncResults.push(syncResult);
            });

            return syncResults;
        };

        PageService.prototype.getPageHierarchyName = function(page) {
            var selectName = [];
            if(page.parent && page.parent.name) {
                if(page.parent.parent) {
                    selectName.push('...');
                }

                selectName.push(page.parent.name);
            }
            selectName.push(page.name);
            return selectName.join(' / ');
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