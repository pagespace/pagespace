(function() {
    var adminApp = angular.module('adminApp');
    adminApp.factory('pageService', function($http, errorFactory) {

        function PageService() {
            this.pageCache = null;
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
            } else if(this.pageCache) {
                //if no filter and the page cache is populated
                return Promise.resolve(this.pageCache);
            }

            var path = '/_api/pages';
            var url = queryKeyValPairs.length ? path + '?' + queryKeyValPairs.join('&') : path;
            return $http.get(url).then(res => {
                //if no filter was used cache
                if(!filter) {
                    self.pageCache = res.data;
                }
                return res.data;
            }).catch(res => {
                throw errorFactory.createResponseError(res);
            });
        };

        PageService.prototype.getAvailableTags = function() {
            return this.getPages().then(pages => {
                //combine all tags into one
                var seen = {};
                return pages.reduce((allTags, page) => {
                    return allTags.concat(page.tags.filter(tag => {
                        return tag.text; //only return tags with text property
                    }));
                }, []).filter(function(tag) {
                    //remove dupes
                    return seen.hasOwnProperty(tag.text) ? false : (seen[tag.text] = true);
                });
            });
        };

        PageService.prototype.getPage = function(pageId) {
            return $http.get('/_api/pages/' + pageId).then(res => res.data).catch(res => {
                throw errorFactory.createResponseError(res);
            });
        };

        PageService.prototype.createPage = function(pageData) {

            if(!pageData.url) {
                pageData.url = this.generateUrl(pageData);
            }
            this.pageCache = null;
            return $http.post('/_api/pages', pageData).then(res => res.data).catch(res => {
                throw errorFactory.createResponseError(res);
            });
        };

        /**
         * Deletes a page. If it is not published, its non-shared includes will also be deleted
         * @param page
         * @return {Promise|Promise.<T>|*}
         */
        PageService.prototype.deletePage = function(page) {

            this.pageCache = null;
            var promise;
            if(page.published) {
                var pageData = {
                    status: page.status || 404
                };

                pageData.redirect = page.redirect ? page.redirect._id : null;

                //live pages are updated to be gone
                promise = $http.put('/_api/pages/' + page._id, pageData);
            } else {
                //pages which have never been published can be hard deleted
                promise = $http.delete('/_api/pages/' + page._id).then(() => {
                    let deleteIncludePromises = [];
                    if(page.template) {
                        for(let templateRegion of page.template.regions) {
                            let pageRegion = page.regions.find(region => region.name === templateRegion.name);
                            if(!templateRegion.sharing && pageRegion) {
                                let promises = pageRegion.includes.map((include) => this.deleteInclude(include._id));
                                deleteIncludePromises = deleteIncludePromises.concat(promises);
                            }
                        }                       
                    }
                    return Promise.all(deleteIncludePromises);
                });
            }
            return promise.then(res => res.data).catch(res => {
                throw errorFactory.createResponseError(res);
            });
        };

        PageService.prototype.deleteInclude = function(includeId) {
            return $http.delete('/_api/includes' + includeId).then(res => res.data).catch(res => {
                throw errorFactory.createResponseError(res);
            });
        };

        PageService.prototype.updatePage = function(pageId, pageData) {
            this.pageCache = null;
            return $http.put('/_api/pages/' + pageId, pageData).then(res => res.data).catch(res => {
                throw errorFactory.createResponseError(res);
            });
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
            });
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

        PageService.prototype.moveInclude = function(page, regionName, fromIndex, toIndex) {
            //find the region
            var region = page.regions.filter(function(region) {
                return region.name === regionName;
            })[0];

            if(region) {
                var includeToMove = region.includes[fromIndex];
                region.includes.splice(fromIndex, 1);
                region.includes.splice(toIndex, 0, includeToMove);
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

        /**
         * Removes an include from a page model. Does not delete the actual include entity
         * @param page
         * @param regionIndex
         * @param includeIndex
         * @return {*}
         */
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
                return region.includes.some(function(includeWrapper) {
                    return includeWrapper.include._id === includeToFind.include;
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

        PageService.prototype.getOrderOfLastPage = function(parentPage) {
            var siblingsQuery = parentPage ? {
                parent: parentPage._id
            } : {
                root: 'top'
            };

            //get future siblings
            return this.getPages(siblingsQuery).then(function(pages) {
                if(pages.length === 0) {
                    return -1;
                }

                let pageOrders = pages.map(page => page.order);
                return Math.max.apply(null, pageOrders);
            });
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