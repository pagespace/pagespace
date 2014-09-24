(function() {

/**
 *
 * @type {*}
 */
var adminApp = angular.module('adminApp');
adminApp.controller("pageController",
    function($scope, $routeParams, $location, pageService, templateService, partService) {

    var pageId = $routeParams.pageId;

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

    $scope.$watch('page.template._id', function(templateId, preTemplateId) {

        var selectedTemplate = null;
        if($scope.templates) {
            $scope.templates.forEach(function(template) {
                if(template._id === templateId) {
                    selectedTemplate = template;
                }
            });

            if(selectedTemplate && preTemplateId) {
                $scope.page.regions = selectedTemplate.regions.map(function(regionKey) {
                    return {
                        region: regionKey,
                        part: null,
                        data: null
                    };
                });
            }
        }
    });
    $scope.$watch('page.regions', function(region) {

    });

    $scope.save = function() {

        var page = {
            name: $scope.page.name,
            url: $scope.page.url,
            template: $scope.page.template._id,
            regions: $scope.page.regions
        };
        pageService.updatePage(pageId, page).success(function(res) {
            console.log("Page saved");
            $location.path("");
        });
    };
});



})();