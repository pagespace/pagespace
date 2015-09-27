(function() {

/**
 *
 * @type {*}
 */
var adminApp = angular.module('adminApp');
adminApp.controller('TemplateListController', function($scope, $rootScope, $routeParams, $location, templateService) {

    $rootScope.pageTitle = 'Templates';

    $scope.templates = [];

    templateService.doGetAvailableTemplates().success(function(templates) {
        $scope.templates = templates;
    }).error(function(err) {
        $scope.showError('Error getting templates', err);
    });

});

})();