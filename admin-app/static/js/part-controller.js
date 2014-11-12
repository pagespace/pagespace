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
        partService.getPart(partId).success(function(part) {
            $scope.part = part;
        }).error(function(err) {
            $rootScope.showError("Error getting part", err);
        });
    }

    $scope.cancel = function() {
        $location.path("/parts");
    };

    $scope.save = function() {
        if(partId) {
            partService.updatePart(partId, $scope.part).success(function(res) {
                console.log("Part saved");
                $rootScope.showSuccess("Part updated.");
                $location.path("/parts");
            }).error(function(err) {
                $rootScope.showError("Error updating part", err);
            });
        } else {
            partService.createPart($scope.part).success(function(res) {
                console.log("Part created");
                $rootScope.showSuccess("Part created.");
                $location.path("/parts");
            }).error(function(err) {
                $rootScope.showError("Error saving part", err);
            });
        }
    };

    $scope.remove = function() {
        partService.deletePart($scope.part._id).success(function (res) {
            console.log("Part removed");
            $location.path("/parts");
        }).error(function(err) {
            $rootScope.showError("Error deleting part", err);
        });
    };
});



})();