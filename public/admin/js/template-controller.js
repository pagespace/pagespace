(function() {

/**
 *
 * @type {*}
 */
var adminApp = angular.module('adminApp');
adminApp.controller("TemplateController", function($scope, $routeParams, $location, templateService) {

    var templateId = $routeParams.templateId;

    $scope.template = {
        regions: []
    };

    if(templateId) {
        templateService.getTemplate(templateId).success(function(template) {
            $scope.template = template;
        });
    }

    $scope.addRegion = function() {
        $scope.template.regions.push("");
    };

    $scope.removeRegion = function(region) {
        var index = $scope.template.regions.indexOf(region);
        if (index > -1) {
            $scope.template.regions.splice(index, 1);
        }
    };

    $scope.cancel = function() {
        $location.path("/templates");
    };

    $scope.save = function() {

        if(templateId) {
            templateService.updateTemplate(templateId, $scope.template).success(function(res) {
                console.log("Template saved");
                $location.path("/templates");
            });
        } else {
            templateService.createTemplate($scope.template).success(function(res) {
                console.log("Template created");
                $location.path("/templates");
            });
        }
    };

    $scope.remove = function() {

        templateService.deleteTemplate(pageId, page).success(function (res) {
            console.log("Template saved");
            $location.path("/tempates");
        });
    };
});



})();