(function() {

/**
 *
 * @type {*}
 */
var adminApp = angular.module('adminApp');
adminApp.controller('PageController',
    function($log, $scope, $rootScope, $routeParams, $location, $timeout,
             pageService, templateService, pluginService, $window) {

    $log.info('Showing page view.');

    $scope.getPageHierarchyName = pageService.getPageHierarchyName;

    $scope.section = $routeParams.section || 'basic';

    $scope.clearNotification();

    var pageId = $routeParams.pageId;

    var parentPageId = $routeParams.parentPageId;
    var order = $routeParams.order;

    //sets the code mirror mode for editing raw include data
    $scope.editorOpts = {
        mode: 'application/json'
    };

    $scope.allPages = [];
    pageService.getPages().then(function(pages) {
        $scope.allPages = pages;
    }).catch(function(err) {
        $scope.showError('Couldn\'t get all pages', err);
    });

    var pageSetupPromises = [];
    pageSetupPromises.push(templateService.doGetAvailableTemplates().then(function(templates) {
        $log.info('Got available templates.');
        $scope.templates = templates;
    }));
    pageSetupPromises.push(pluginService.getPlugins().then(function(availablePlugins) {
        $log.debug('Got available plugins.');
        $scope.availablePlugins = availablePlugins;
    }));

    if(pageId) {
        $log.debug('Fetching page data for: %s', pageId);
        $scope.pageId = pageId;
        pageSetupPromises.push(pageService.getPage(pageId).then(function(page) {
            $log.debug('Got page data OK.');
            $log.trace('...with data:\n', JSON.stringify(page, null, '\t'));
            $scope.page = page;

            if(page.expiresAt) {
                page.expiresAt = new Date(page.expiresAt);
            }
            if(page.publishedAt) {
                page.publishedAt = new Date(page.publishedAt);
            }

            //depopulate redirect page
            if(page.redirect) {
                page.redirect = page.redirect._id;
            }
        }));
    } else {
        $scope.page = {
            regions: [],
            useInNav: true
        };
        if(parentPageId) {
            pageSetupPromises.push(pageService.getPage(parentPageId).then(function(page) {
                $scope.page.parent = page;
            }));
        } else {
            $scope.page.root = 'top';
        }
    }

    Promise.all(pageSetupPromises).then(function () {
        //if there's only one template choose it automatically
        if(!$scope.page.template && $scope.templates.length === 1) {
            $scope.page.template = $scope.templates[0];
        }
    }).catch(function (err) {
        $scope.showError(err);
    });

    $scope.updateUrl = function() {
        $scope.page.url = pageService.generateUrl($scope.page);
    };

    $scope.cancel = function() {
        $location.path('/pages');
    };

    $scope.$watch('page.name', function() {
        if(!pageId && $scope.pageForm && $scope.pageForm.url && $scope.pageForm.url.$pristine) {
            $scope.updateUrl();
        }
    });

    $scope.syncResults = null;

    $scope.synchronizeWithBasePage = function(page) {
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
        $scope.syncResults = [];
        page.template.regions.forEach(function(templateRegion) {
            var syncResult = {
                region: templateRegion.name,
                removedCount: 0,
                sharedCount: 0
            };
            var sharing = (templateRegion.sharing || '').split(/\s+/);
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
                    if(sharing.indexOf('plugins') >= 0 && sharing.indexOf('data') >= 0 &&
                        !containsInclude(pageRegion, baseInclude)) {
                        pageRegion.includes.push(baseInclude);
                    }
                });
                syncResult.sharedCount = pageRegion.includes.length - startCount;
            }
            $scope.syncResults.push(syncResult);
        });

        return page;
    };

    $scope.save = function(form) {
        if(form.$invalid) {
            $scope.submitted = true;
            $window.scrollTo(0,0);
            return;
        }

        var page = $scope.page;
        if(order) {
            page.order = order;
        }

        if(pageId) {
            $log.info('Update page: %s...', pageId);
            $log.trace('...with data:\n%s', JSON.stringify(page, null, '\t'));
            page = pageService.depopulatePage(page);
            pageService.updatePage(pageId, page).then(function() {
                $log.info('Page successfully updated');
                $scope.showSuccess('Page: ' + page.name + ' saved.');
                $location.path('');
            }).catch(function(err) {
                $log.error(err, 'Error updating page');
                $scope.showError('Error updating page', err);
            });
        } else {
            $log.info('Creating page...');
            $log.trace('...with data:\n%s', JSON.stringify(page, null, '\t'));

            //create regions based on template
            var pageRegions = [];
            page.template.regions.forEach(function(regionMeta) {
                var newRegion = {};
                newRegion.name = regionMeta.name;
                newRegion.includes = [];
                pageRegions.push(newRegion);
            });
            page.regions = pageRegions;

            if(page.basePage) {
                page = $scope.synchronizeWithBasePage(page);
            }

            page = pageService.depopulatePage(page);
            pageService.createPage(page).then(function(res) {
                var page = res.data;
                $log.info('Page successfully created');
                $scope.showSuccess('Page: ' + page.name + ' created.');
                $location.path('');
            }).catch(function(err) {
                $log.error(err, 'Error creating page');
                $scope.showError('Error adding new page', err);
            });
        }
    };
});

})();