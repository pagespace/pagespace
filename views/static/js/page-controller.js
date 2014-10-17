(function() {

/**
 *
 * @type {*}
 */
var adminApp = angular.module('adminApp');
adminApp.controller("pageController",
    function($scope, $rootScope, $routeParams, $location, $timeout,
             pageService, templateService, partService, partInstanceService, powerMode) {

    $rootScope.pageTitle = "Page";

    var pageId = $routeParams.pageId;

    $scope.powerMode = powerMode;
    $scope.selectedTemplateIndex = 0;
    $scope.selectedTemplate = null;

    async.series([
        function getTemplates(callback) {
            templateService.getTemplates().success(function(templates) {
                $scope.templates = templates;
                callback()
            });
        },
        function getParts(callback) {
            partService.getParts().success(function(parts) {
                $scope.parts = parts;
                callback()
            });
        },
        function getPage(callback) {
            pageService.getPage(pageId).success(function(page) {
                $scope.page = page;

                var selectedTemplate = $scope.templates.filter(function(template) {
                    return page.template._id === template._id;
                });

                $scope.selectedTemplate = selectedTemplate.length ? selectedTemplate[0] : null;
                $scope.selectedTemplateIndex = $scope.templates.indexOf($scope.selectedTemplate);

                callback();
            });
        }
    ], function(err) {
        if(err) {
            $rootScope.showError(err);
        }
    });

    $scope.updateUrl = function() {
        $scope.page.url = pageService.generateUrl($scope.page);
    };

    $scope.cancel = function() {
        $location.path("");
    };

    $scope.selectTemplate = function(template) {
        $scope.selectedTemplate = template;
    };

    $scope.addRegion = function() {
        $scope.page.regions.push({
            region: null,
            partInstance: null
        });
    };

    $scope.clearRegion = function(regionToRemove) {
        $scope.page.regions = $scope.page.regions.filter(function(region) {
            return regionToRemove.region !== region.region;
        });
    };

    $scope.save = function() {
        var createPartInstanceFns = $scope.page.regions.map(function(region) {
            return function(callback) {

                var res;
                if(region.region && region.partInstance) {
                    if(region.partInstance._id) {
                        res = partInstanceService.updatePartInstance(region.partInstance._id, region.partInstance);
                    } else {
                        res = partInstanceService.createPartInstance(region.partInstance);
                    }
                    res.success(function(data) {
                        callback(null, {
                            region: region.region,
                            partInstance: data._id
                        });
                    });
                    res.error(function(err) {
                        callback(err);
                    });
                } else {
                    callback(null, null);
                }
                $timeout(function() {
                    $scope.$apply();
                }, 0);

            };
        });

        async.parallel(createPartInstanceFns, function(err, regionUpdates) {
            var page = {
                name: $scope.page.name,
                url: $scope.page.url,
                template: $scope.selectedTemplate._id,
                regions: regionUpdates.filter(function(region) {
                    return region !== null;
                })
            };

            pageService.updatePage(pageId, page).success(function(res) {
                $rootScope.showSuccess("Page: " + page.name + " saved.");
                $location.path("");
            }).error(function(err) {
                $rootScope.showError("Error saving page", err);
            });
        });
    };
});

adminApp.directive('viewTemplate', function() {

    function link(scope, element, attrs) {
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
                var text = new fabric.Text(region, {
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

    return {
        //scope: '=canvasData',
        restrict: 'E',
        link: link
    };
});

})();