(function() {

/**
 *
 * @type {*}
 */
var adminApp = angular.module('adminApp');
adminApp.controller("PageController",
    function($scope, $rootScope, $routeParams, $location, $timeout,
             pageService, templateService, partService, $window) {

    $rootScope.clearNotification();
    $rootScope.pageTitle = "Page";

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

    var getPageFunctions = [];
    getPageFunctions.push(function getTemplates(callback) {
        templateService.getTemplates().success(function(templates) {
            $scope.templates = templates;
            callback()
        });
    });
    getPageFunctions.push(function getParts(callback) {
        partService.getParts().success(function(parts) {
            $scope.parts = parts;
            callback()
        });
    });
    if(pageId) {
        $scope.pageId = pageId;
        getPageFunctions.push(function getPage(callback) {
            pageService.getPage(pageId).success(function(page) {
                $scope.page = page;

                if(page.expiresAt) {
                    page.expiresAt = new Date(page.expiresAt);
                }

                $scope.template = $scope.templates.filter(function(template) {
                    return page.template && page.template._id === template._id;
                })[0] || null;

                page.regions.map(function(region) {
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
            getPageFunctions.push(function getParentPage(callback) {
                pageService.getPage(parentPageId).success(function(page) {
                    $scope.page.parent = page;
                    callback();
                });
            });
        } else {
            $scope.page.root = 'primary';
        }
    }

    async.series(getPageFunctions, function(err) {
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
        if($scope.pageForm.url.$pristine && !pageId) {
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
            pageService.updatePage(pageId, page).success(function(res) {
                $rootScope.showSuccess("Page: " + page.name + " saved.");
                $location.path("");
            }).error(function(err) {
                $rootScope.showError("Error saving page", err);
            });
        } else {
            pageService.createPage($scope.page).success(function() {
                $rootScope.showSuccess("Page: " + page.name + " created.");
                $location.path("");
            }).error(function(err) {
                $rootScope.showError("Error adding new page", err);
            });
        }
    };

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
});

adminApp.directive('viewTemplate', function() {

    function link(scope, element) {

        scope.$watch('template', function(){
           drawTemplate();
        });

        function drawTemplate() {
            element.html('<canvas width="550" height="400"></canvas>');
            var canvas = new fabric.Canvas(element.find('canvas')[0]);
            canvas.backgroundColor = '#ddd';

            scope.template.regions.forEach(function(region, i) {

                var canvasData = scope.template.regionData[i];

                if(canvasData) {
                    canvasData.stroke = '#000';
                    canvasData.strokeWidth = 1;
                    canvasData.fill = '#fff';
                    var rect = new fabric.Rect(canvasData);
                    var text = new fabric.Text(region.name, {
                        fontSize: 16,
                        fontFamily: 'Arial',
                        top: canvasData.top + 5,
                        left: canvasData.left + 5
                    });

                    var group = new fabric.Group([ rect, text ], {
                        left: canvasData.left,
                        top: canvasData.top,
                        hasControls: false,
                        lockMovementX: true,
                        lockMovementY: true
                    });
                    group.on('selected', function() {
                        scope.selectedRegionIndex = i;
                        scope.$apply();
                    });
                    canvas.add(group);
                    canvas.sendToBack(group);
                }
            });
        }
    }

    return {
        //scope: '=canvasData',
        restrict: 'E',
        link: link
    };
});

})();