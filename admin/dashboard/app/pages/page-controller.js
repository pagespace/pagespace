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

    $scope.clearNotification();

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
        partService.getParts().success(function(availableParts) {
            $log.debug('Got available parts.');
            $scope.availableParts = availableParts;
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

                page.regions.map(function(region) {
                    region.data = region.data.map(function(datum) {
                        return stringifyData(datum);
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
            $scope.page.root = 'primary';
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
        }
    });

    $scope.updateUrl = function() {
        $scope.page.url = pageService.generateUrl($scope.page);
    };

    $scope.addPart = function(regionIndex) {
        $scope.page.regions[regionIndex].parts.push(null);
        $scope.page.regions[regionIndex].data.push('{}');
    };

    $scope.setDefaultDataForRegion = function(regionIndex, partIndex) {

        var partId = $scope.page.regions[regionIndex].parts[partIndex]._id;
        var part = $scope.availableParts.filter(function(availablePart) {
            return availablePart._id === partId;
        })[0];
        var defaultData = part && part.defaultData ? part.defaultData : {};
        $scope.page.regions[regionIndex].data[partIndex] = stringifyData(defaultData);
    };

    $scope.removePart = function(regionIndex, partIndex) {
        var really = window.confirm('Really delete this part?');
        if(really) {
            for(var i = $scope.page.regions[regionIndex].parts.length - 1; i >= 0; i--) {
                if(i === partIndex) {
                    $scope.page.regions[regionIndex].parts.splice(i, 1);
                }
            }
        }
    };

    $scope.cancel = function() {
        $location.path("/pages");
    };

    $scope.selectTemplate = function(template) {

        template.regions = template.regions.map(function(region) {
            region.data = region.data.map(function(datum) {
                return typeof datum !== 'string' ? stringifyData(datum) : datum;
            });

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
            if(region.parts) {
                region.parts = region.parts.map(function(part) {
                    return part._id
                });
            }
            if(region.data) {
                region.data = region.data.map(function(datum) {
                    if(isJson(datum)) {
                        return JSON.parse(datum);
                    }
                    return region.data;
                });
            }
            return region;
        });

        if(pageId) {
            $log.info('Update page: %s...', pageId);
            $log.trace('...with data:\n%s', JSON.stringify(page, null, '\t'));
            pageService.updatePage(pageId, page).success(function(res) {
                $log.info('Page successfully updated');
                $scope.showSuccess("Page: " + page.name + " saved.");
                $location.path("");
            }).error(function(err) {
                $log.error(err, 'Error updating page');
                $scope.showError("Error updating page", err);
            });
        } else {
            $log.info('Creating page...');
            $log.trace('...with data:\n%s', JSON.stringify(page, null, '\t'));
            pageService.createPage(page).success(function() {
                $log.info('Page successfully created');
                $scope.showSuccess("Page: " + page.name + " created.");
                $location.path("");
            }).error(function(err) {
                $log.error(err, 'Error creating page');
                $scope.showError("Error adding new page", err);
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