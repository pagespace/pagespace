(function() {

/**
 *
 * @type {*}
 */
var adminApp = angular.module('adminApp');
adminApp.controller("pageController",
    function($scope, $routeParams, $location, $timeout, pageService, templateService, partService, partInstanceService) {

    var pageId = $routeParams.pageId;

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
                $scope.selectedTemplate = page.template;
                callback();
            });
        }
    ], function(err) {
        if(err) {
            console.warn(err);
        }
    });

    $scope.updateUrl = function() {
        $scope.page.url = pageService.generateUrl($scope.page);
    };

    $scope.cancel = function() {
        $location.path("");
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
                        console.warn(err);
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
                    return region !== null
                })
            };

            pageService.updatePage(pageId, page).success(function(res) {
                console.log("Page saved");
                $location.path("");
            });
        });
    };
});


})();