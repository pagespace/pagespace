
(function() {

    /**
     *
     * @type {*}
     */
    var adminApp = angular.module('adminApp');
    adminApp.controller('MediaItemController', function($scope, $rootScope, $location, $routeParams, mediaService) {
        $rootScope.pageTitle = 'Media';

        $scope.isImage = mediaService.isImage;
        $scope.humanFileSize = mediaService.humanFileSize;

        var mediaId = $routeParams.mediaId;

        $scope.deleteItem = function(item) {
            var really = window.confirm('Really delete the item, ' + item.name + '?');
            if(really) {
                mediaService.deleteItem(item._id).success(function() {
                    $location.path('/media');
                    $rootScope.showInfo("Media: " + item.name + " removed.");
                }).error(function(err) {
                    $rootScope.showError("Error deleting page", err);
                });
            }
        };


        $scope.cancel = function() {
            $location.path('/media');
        };

        mediaService.getItem(mediaId).success(function(item) {
            $scope.item = item;
        }).error(function(err) {
            $rootScope.showError("Error getting media item", err);
        });
    });

})();