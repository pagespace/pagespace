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

    $scope.section = $routeParams.section || 'basic';

    $scope.clearNotification();

    var pageId = $routeParams.pageId;

    var parentPageId = $routeParams.parentPageId;
    var order = $routeParams.order;

    //sets the code mirror mode for editing raw include data
    $scope.editorOpts = {
        mode: 'application/json'
    };

    $scope.basePage = null;

    $scope.allPages = [];
    pageService.getPages().success(function(pages) {
        $scope.allPages = pages;
    }).error(function(err) {
        $scope.showError('Couldn\'t get all pages', err);
    });

    var pageSetupFunctions = [];
    pageSetupFunctions.push(function getTemplates(callback) {
        $log.info('Fetching available templates...');
        templateService.doGetAvailableTemplates().success(function(templates) {
            $log.info('Got available templates.');
            $scope.templates = templates;
            callback();
        });
    });
    pageSetupFunctions.push(function getPlugins(callback) {
        $log.debug('Fetching available plugins...');
        pluginService.getPlugins().success(function(availablePlugins) {
            $log.debug('Got available plugins.');
            $scope.availablePlugins = availablePlugins;
            callback();
        });
    });

    if(pageId) {
        $log.debug('Fetching page data for: %s', pageId);
        $scope.pageId = pageId;
        pageSetupFunctions.push(function getPage(callback) {
            pageService.getPage(pageId).success(function(page) {
                $log.debug('Got page data OK.');
                $log.trace('...with data:\n', JSON.stringify(page, null, '\t'));
                $scope.page = page;

                if(page.expiresAt) {
                    page.expiresAt = new Date(page.expiresAt);
                }

                //depopulate redirect page
                if(page.redirect) {
                    page.redirect = page.redirect._id;
                }
                callback();
            });
        });
    } else {
        $scope.page = {
            regions: []
        };
        if(parentPageId) {
            pageSetupFunctions.push(function getParentPage(callback) {
                pageService.getPage(parentPageId).success(function(page) {
                    $scope.page.parent = page;
                    callback();
                });
            });
        } else {
            $scope.page.root = 'top';
        }
    }

    async.series(pageSetupFunctions, function(err) {
        if(err) {
            $scope.showError(err);
        } else {
            //if there's only one template choose it automatically
            if(!$scope.page.template && $scope.templates.length === 1) {
                $scope.page.template = $scope.templates[0];
            }
        }
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
            pageService.updatePage(pageId, page).success(function() {
                $log.info('Page successfully updated');
                $scope.showSuccess('Page: ' + page.name + ' saved.');
                $location.path('');
            }).error(function(err) {
                $log.error(err, 'Error updating page');
                $scope.showError('Error updating page', err);
            });
        } else {
            $log.info('Creating page...');
            $log.trace('...with data:\n%s', JSON.stringify(page, null, '\t'));

            page.basePage = JSON.parse(page.basePage);

             var getRegionFromBasePage = function(regionName) {
                return page.basePage.regions.filter(function(region) {
                    return region.name === regionName;
                })[0] || null;
            };
            if(page.basePage) {
                //get basepage from id value

                var pageRegions = [];
                page.template.regions.forEach(function(regionMeta) {
                    var newRegion = {};
                    newRegion.includes = [];
                    newRegion.name = regionMeta.name;
                    var baseRegion = getRegionFromBasePage(regionMeta.name);
                    if(baseRegion) {
                        baseRegion.includes.forEach(function(baseInclude) {
                            var newInclude = {};
                            var sharing = regionMeta.sharing.split(/\s+/);
                            if(sharing.indexOf('plugins') >= 0) {
                                newInclude.plugin = baseInclude.plugin;
                            }
                            if(sharing.indexOf('data') >= 0) {
                                newInclude.data = baseInclude.data;
                            }
                            if(newInclude.plugin || newInclude.data) {
                                newRegion.includes.push(newInclude);
                            }
                        });
                    }
                    pageRegions.push(newRegion);
                });
                page.regions = pageRegions;
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