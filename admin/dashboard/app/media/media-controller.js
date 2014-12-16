
(function() {

/**
 *
 * @type {*}
 */
var adminApp = angular.module('adminApp');
adminApp.controller('MediaController', function($scope, $rootScope, $location, mediaService) {
    $rootScope.pageTitle = 'Media';

    $scope.isImage = mediaService.isImage;
    $scope.getMimeClass = mediaService.getMimeClass;

    $scope.showItem = function(item) {
        $location.path('/media/' + item._id);
    };

    mediaService.getItems().success(function(items) {
        $scope.mediaItems = items;
    }).error(function(err) {
        $rootScope.showError("Error getting media items", err);
    });
});

})();