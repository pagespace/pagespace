(function() {

/**
 *
 * @type {*}
 */
var adminApp = angular.module('adminApp');
adminApp.controller("PartController", function($scope, $rootScope, $routeParams, $location, $window, partService) {

    $rootScope.pageTitle = "Page Part";

    var partId = $routeParams.partId;
    $scope.partId = partId;

    //sets the code mirror mode for editing raw part data
    $scope.editorOpts = {
        mode: 'application/json'
    };

    $scope.part = {};

    if(partId) {
        partService.getPart(partId).success(function(part) {
            $scope.part = part;
        }).error(function(err) {
            $scope.showError("Error getting part", err);
        });
    }

    $scope.reset = function() {
        partService.resetPart($scope.part).success(function() {
            $scope.showSuccess("Cache cleared");
        }).error(function(err) {
            $scope.showError("Error getting part", err);
        })
    };

    $scope.cancel = function() {
        $location.path("/parts");
    };

    $scope.save = function(form) {
        if(form.$invalid) {
            $scope.submitted = true;
            $window.scrollTo(0,0);
            return;
        }

        if(partId) {
            partService.updatePart(partId, $scope.part).success(function(res) {
                console.log("Part saved");
                $scope.showSuccess("Part updated.");
                $location.path("/parts");
            }).error(function(err) {
                $scope.showError("Error updating part", err);
            });
        } else {
            partService.createPart($scope.part).success(function(res) {
                console.log("Part created");
                $scope.showSuccess("Part created.");
                $location.path("/parts");
            }).error(function(err) {
                $scope.showError("Error saving part", err);
            });
        }
    };

    $scope.remove = function() {
        var really = window.confirm('Really delete this part?');
        if(really) {
            partService.deletePart($scope.part._id).success(function (res) {
                $scope.showInfo("Part removed", err);
                $location.path("/parts");
            }).error(function (err) {
                $scope.showError("Error deleting part", err);
            });
        }
    };
});



})();