(function() {

/**
 *
 * @type {*}
 */
var adminApp = angular.module('adminApp');
adminApp.controller('TemplateListController', function($scope, $rootScope, $routeParams, $location, templateService) {

    $rootScope.pageTitle = 'Templates';

    $scope.templates = [];

    templateService.getAvailableTemplates().then(function(templates) {
        $scope.templates = templates;
    }).catch(function(err) {
        $scope.showError('Error getting templates', err);
    });

});

})();