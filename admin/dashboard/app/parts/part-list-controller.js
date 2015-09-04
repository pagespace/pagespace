(function() {

/**
 *
 * @type {*}
 */
var adminApp = angular.module('adminApp');
adminApp.controller('PartListController', function($scope, $rootScope, $routeParams, $location, partService) {

    $rootScope.pageTitle = "Page Parts";

    $scope.parts = [];

    partService.getParts().success(function(parts) {
        $scope.parts = parts;
    }).error(function(err) {
        $scope.showError("Error getting parts", err);
    });

});

})();