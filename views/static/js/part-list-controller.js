(function() {

/**
 *
 * @type {*}
 */
var adminApp = angular.module('adminApp');
adminApp.controller('partListController', function($scope, $routeParams, $location, partService) {

    $scope.parts = [];

    partService.getParts().success(function(parts) {
        $scope.parts = parts;
    });

});

})();