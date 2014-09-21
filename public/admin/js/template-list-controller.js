(function() {

/**
 *
 * @type {*}
 */
var adminApp = angular.module('adminApp');
adminApp.controller("TemplateListController", function($scope, $routeParams, $location, templateService) {

    $scope.templates = [];

    templateService.getTemplates().success(function(templates) {
        $scope.templates = templates;
    });


});

})();