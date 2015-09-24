
(function() {

    /**
     *
     * @type {*}
     */
    var adminApp = angular.module('adminApp');
    adminApp.controller('MediaItemController', function($scope, $rootScope, $location, $routeParams, mediaService) {
        $rootScope.pageTitle = 'Media';

        $scope.isImage = mediaService.isImage;
        $scope.isText = mediaService.isText;
        $scope.isDocument = mediaService.isDocument;
        $scope.getSrcPath = mediaService.getSrcPath;
        $scope.humanFileSize = mediaService.humanFileSize;

        var mediaId = $routeParams.mediaId;

        $scope.deleteItem = function(item) {
            var really = window.confirm('Really delete the item, ' + item.name + '?');
            if(really) {
                mediaService.deleteItem(item._id).success(function() {
                    $location.path('/media');
                    $scope.showInfo("Media: " + item.name + " removed.");
                }).error(function(err) {
                    $scope.showError("Error deleting page", err);
                });
            }
        };

        $scope.cancel = function() {
            $location.path('/media');
        };

        mediaService.getItem(mediaId).then(function(res) {
            $scope.item = res.data;
            return mediaService.isText(res.data) ? mediaService.getItemText(res.data) : null;
        }).then(function(res) {
            if(res) {
                $scope.editorOpts = {
                    mode: 'xml'
                };
                $scope.itemText = res.data;
            }
        }).catch(function(err) {
            $scope.showError('Error getting media item', err);
        });

        $scope.updateItemText = function() {
            mediaService.updateItemText($scope.item, $scope.itemText).success(function() {
                $scope.showSuccess('Media item updated');
                $location.path('/media');
            }).error(function(err) {
                $scope.showError('Could not update text media', err);
            });
        };
    });

})();