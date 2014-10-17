(function() {

/**
 *
 * @type {*}
 */
var adminApp = angular.module('adminApp');
adminApp.controller('partListController', function($scope, $rootScope, $routeParams, $location, partService) {

    $rootScope.pageTitle = "Page Part";

    $scope.parts = [];

    partService.getParts().success(function(parts) {
        $scope.parts = parts;
    }).error(function(err) {
        $rootScope.showError("Error getting parts", err);
    });

});

})();