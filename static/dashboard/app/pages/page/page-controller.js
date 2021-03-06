(function() {

/**
 *
 * @type {*}
 */
var adminApp = angular.module('adminApp');
adminApp.controller('PageController',
    function($log, $scope, $rootScope, $routeParams, $location, $timeout,
             pageService, templateService, pluginService, mediaService, $window) {

    $log.info('Showing page view.');

    $scope.getPageHierarchyName = pageService.getPageHierarchyName;
    $scope.getSrcPath = mediaService.getSrcPath.bind(mediaService);

    $scope.section = $routeParams.section || 'basic';

    $scope.clearNotification();

    var pageId = $routeParams.pageId;

    var parentPageId = $routeParams.parentPageId;
    var order = $routeParams.order;

    $scope.allPages = [];
    $scope.basePages = [];    
    pageService.getPages().then(function(pages) {
        $scope.allPages = pages;
        $scope.basePages = pages.filter(page => {
            return page.isBasePage && page._id !== pageId;
        });
    }).catch(function(err) {
        $scope.showError('Couldn\'t get all pages', err);
    });

    var pageSetupPromises = [];
    pageSetupPromises.push(templateService.getAvailableTemplates().then(function(templates) {
        $log.info('Got available templates.');
        $scope.templates = templates;
    }));
    pageSetupPromises.push(pluginService.getPlugins().then(function(availablePlugins) {
        $log.debug('Got available plugins.');
        $scope.availablePlugins = availablePlugins;
    }));
    pageSetupPromises.push(mediaService.getItems({ 
        tags : 'contains({"text" : "share"})'
    }).then(function (availableImages) {
        $log.debug('Got available images.');
        $scope.availableImages = availableImages;
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
        
    pageService.getAvailableTags().then(tags => {
        $scope.availableTags  = tags;
    });

    $scope.getMatchingTags = function(text) {
        text = text.toLowerCase();
        const tags = $scope.availableTags.filter(tag => tag.text && tag.text.toLowerCase().indexOf(text) > -1);
        return Promise.resolve(tags);
    };

    $scope.revertTitle = function() {
        $scope.page.title = $scope.page.name;
    };

    $scope.cancel = function() {
        $location.path('/pages');
    };

    $scope.$watch('page.name', function() {
        if(!pageId && $scope.pageForm && $scope.pageForm.url && $scope.pageForm.url.$pristine) {
            $scope.updateUrl();
        }
    });

    $scope.$watch('page.status', function(status) {
        status = parseInt(status, 10);
        if($scope.page && status !== 301 && status !== 302) {
            $scope.page.redirect = null;
        }
    });
        
    $scope.syncResults = null;

    $scope.synchronizeWithBasePage = function(page) {
        $scope.syncResults = pageService.synchronizeWithBasePage(page);
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
                pageService.synchronizeWithBasePage(page);
            }

            page = pageService.depopulatePage(page);
            pageService.createPage(page).then(function(page) {
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