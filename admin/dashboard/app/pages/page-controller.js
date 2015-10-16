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

    $scope.editRegions = false;
    $scope.toggleEditRegions = function() {
        $scope.editRegions = !$scope.editRegions;
    };

    $scope.selectedRegionIndex = 0;
    $scope.template = null;

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

                $scope.template = $scope.templates.filter(function(template) {
                    return page.template && page.template._id === template._id;
                })[0] || null;

                page.regions.map(function(region) {
                    region.includes = region.includes.map(function(include) {
                        include.data = stringifyData(include.data);
                        return include;
                    });
                    return region;
                });

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
                $scope.selectTemplate($scope.templates[0]);
            }
            $scope.updateRegions($scope.template);
        }
    });

    $scope.updateUrl = function() {
        $scope.page.url = pageService.generateUrl($scope.page);
    };

    $scope.addInclude = function(regionIndex) {
        $scope.page.regions[regionIndex].includes.push({
            plugin: null,
            data: {}
        });
    };

    $scope.setDefaultDataForInclude = function(regionIndex, includeIndex) {
        var pluginId = $scope.page.regions[regionIndex].includes[includeIndex].plugin._id;
        var plugin = $scope.availablePlugins.filter(function(availablePlugin) {
            return availablePlugin._id === pluginId;
        })[0];
        var defaultData = plugin && plugin.defaultData ? plugin.defaultData : {};
        $scope.page.regions[regionIndex].includes[includeIndex].data = stringifyData(defaultData);
    };

    $scope.removeInclude = function(region, includeIndex) {
        var really = window.confirm('Really delete this include?');
        if(really) {
            $scope.page = pageService.removeInclude($scope.page, region, includeIndex);
        }
    };

    $scope.cancel = function() {
        $location.path('/pages');
    };

    $scope.updateRegions = function(template) {
        function isRegionNew(regionName) {
            return !$scope.page.regions.some(function(region) {
                return region.name === regionName;
            });
        }

        template.regions.forEach(function(templateRegion) {
            if(isRegionNew(templateRegion.name)) {
                $scope.page.regions.push(templateRegion);
            }
        });
    };

    $scope.selectTemplate = function(template) {

        template.regions = template.regions.map(function(region) {
            region.include = region.includes.map(function(include) {
                include.data = typeof include.data !== 'string' ? stringifyData(include.data) : include.data;
                return include;
            });

            return region;
        });

        $scope.template = template;

        if($scope.page && template) {
            $scope.updateRegions(template);
        }
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

        //unpopulate
        page = pageService.depopulatePage(page, $scope.template._id);

        if(pageId) {
            $log.info('Update page: %s...', pageId);
            $log.trace('...with data:\n%s', JSON.stringify(page, null, '\t'));
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
            pageService.createPage(page).success(function() {
                $log.info('Page successfully created');
                $scope.showSuccess('Page: ' + page.name + ' created.');
                $location.path('');
            }).error(function(err) {
                $log.error(err, 'Error creating page');
                $scope.showError('Error adding new page', err);
            });
        }
    };
});


    function stringifyData(val) {
        return typeof val === 'object' ? JSON.stringify(val, null, 2) : val;
    }
})();