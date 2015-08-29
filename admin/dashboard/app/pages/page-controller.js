(function() {

/**
 *
 * @type {*}
 */
var adminApp = angular.module('adminApp');
adminApp.controller("PageController",
    function($log, $scope, $rootScope, $routeParams, $location, $timeout,
             pageService, templateService, partService, $window) {

    $log.info('Showiing page view.');

    $scope.section = $routeParams.section || 'basic';

    $rootScope.clearNotification();

    var pageId = $routeParams.pageId;

    var parentPageId = $routeParams.parentPageId;
    var order = $routeParams.order;

    //sets the code mirror mode for editing raw part data
    $scope.editorOpts = {
        mode: 'application/json'
    };

    $scope.editRegions = false;
    $scope.toggleEditRegions = function() {
        $scope.editRegions = !$scope.editRegions;
    };

    $scope.selectedRegionIndex = -1;
    $scope.template = null;

    var pageSetupFunctions = [];
    pageSetupFunctions.push(function getTemplates(callback) {
        $log.info('Fetching available templates...');
        templateService.doGetAvailableTemplates().success(function(templates) {
            $log.info('Got available templates.');
            $scope.templates = templates;
            callback()
        });
    });
    pageSetupFunctions.push(function getParts(callback) {
        $log.debug('Fetching available parts...');
        partService.getParts().success(function(parts) {
            $log.debug('Got available parts.');
            $scope.parts = parts;
            callback()
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

                $scope.template = $scope.templates.filter(function(template) {
                    return page.template && page.template._id === template._id;
                })[0] || null;

                page.regions = page.regions.map(function(region) {
                    region.data = stringifyData(region.data);
                    region.dataFromServer = !!region.data;
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
            $scope.page.root = 'primary';
        }
    }

    async.series(pageSetupFunctions, function(err) {
        if(err) {
            $rootScope.showError(err);
        } else {
            //if there's only one template choose it automatically
            if(!$scope.page.template && $scope.templates.length === 1) {
                $scope.selectTemplate($scope.templates[0]);
            }
        }
    });

    $scope.updateUrl = function() {
        $scope.page.url = pageService.generateUrl($scope.page);
    };

    $scope.cancel = function() {
        $location.path("");
    };

    $scope.selectTemplate = function(template) {

        template.regions = template.regions.map(function(region) {
            region.data = typeof data !== 'string' ? stringifyData(region.data) : region.data;
            return region;
        });

        $scope.template = template;

        if($scope.page && template) {
            $scope.page.regions = [];
            template.regions.forEach(function(region) {
                $scope.page.regions.push(region);
            });
        }
    };

    $scope.$watch('page.name', function() {
        if($scope.pageForm && $scope.pageForm.url.$pristine && !pageId) {
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
        delete page.createdBy;
        delete page.updatedBy;
        delete page.createdAt;
        delete page.updatedAt;
        page.template = $scope.template._id;
        if(page.parent && page.parent._id) {
            page.parent = page.parent._id;
        }
        if(page.redirect && page.redirect._id) {
            page.redirect = page.redirect._id;
        }
        page.regions = page.regions.filter(function(region) {
            return typeof region === 'object';
        }).map(function(region) {
            if(region.part) {
                region.part = region.part._id;
            }
            if(isJson(region.data)) {
                region.data = JSON.parse(region.data);
            }
            return region;
        });

        if(pageId) {
            $log.info('Update page: %s...', pageId);
            $log.trace('...with data:\n%s', JSON.stringify(page, null, '\t'));
            pageService.updatePage(pageId, page).success(function(res) {
                $log.info('Page successfully updated');
                $rootScope.showSuccess("Page: " + page.name + " saved.");
                $location.path("");
            }).error(function(err) {
                $log.error(err, 'Error updating page');
                $rootScope.showError("Error updating page", err);
            });
        } else {
            $log.info('Creating page...');
            $log.trace('...with data:\n%s', JSON.stringify(page, null, '\t'));
            pageService.createPage(page).success(function() {
                $log.info('Page successfully created');
                $rootScope.showSuccess("Page: " + page.name + " created.");
                $location.path("");
            }).error(function(err) {
                $log.error(err, 'Error creating page');
                $rootScope.showError("Error adding new page", err);
            });
        }
    };


});


    function stringifyData(val) {
        return typeof val === 'object' ? JSON.stringify(val, null, 2) : val;
    }

    function isJson(str) {
        try {
            JSON.parse(str);
        } catch(e) {
            return false;
        }
        return true;
    }
})();