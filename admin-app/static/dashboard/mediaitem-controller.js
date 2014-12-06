
(function() {

    /**
     *
     * @type {*}
     */
    var adminApp = angular.module('adminApp');
    adminApp.controller('mediaItemController', function($scope, $rootScope, $location, $routeParams, mediaService) {
        $rootScope.pageTitle = 'Media';

        $scope.isImage = mediaService.isImage;

        var mediaId = $routeParams.mediaId;

        mediaService.getItem(mediaId).success(function(item) {
            $scope.item = item;
        }).error(function(err) {
            $rootScope.showError("Error getting media item", err);
        });
    });

})();