(function() {

/**
 *
 * @type {*}
 */
var adminApp = angular.module('adminApp');
adminApp.controller("partController", function($scope, $rootScope, $routeParams, $location, partService) {

    $rootScope.pageTitle = "Page Part";

    var partId = $routeParams.partId;

    $scope.part = {};

    if(partId) {
        partService.getTemplate(partId).success(function(part) {
            $scope.part = part;
        });
    }

    $scope.cancel = function() {
        $location.path("/parts");
    };

    $scope.save = function() {
        if(partId) {
            partService.updatePart(partId, $scope.part).success(function(res) {
                console.log("Part saved");
                $location.path("/parts");
            });
        } else {
            partService.createPart($scope.part).success(function(res) {
                console.log("Part created");
                $location.path("/parts");
            });
        }
    };

    $scope.remove = function() {
        partService.deleteTemplate($scope.part._id).success(function (res) {
            console.log("Part removed");
            $location.path("/parts");
        });
    };
});



})();