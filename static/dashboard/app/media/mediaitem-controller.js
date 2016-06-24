
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

        $scope.getDocSrcPath = function(item) {
            return item ? `/_media/${item.fileName}` : null;
        };

        var mediaId = $routeParams.mediaId;
        
        $scope.cancel = function() {
            $location.path('/media');
        };

        mediaService.getItem(mediaId).then(function(item) {
            $scope.item = item;
            return mediaService.isText(item) ? mediaService.getItemText(item) : null;
        }).then(function(text) {
            if(text) {
                $scope.editorOpts = {
                    mode: 'xml'
                };
                $scope.itemText = text;
            }
        }).catch(function(err) {
            $scope.showError('Error getting media item', err);
        });

        $scope.updateItemText = function() {
            mediaService.updateItemText($scope.item, $scope.itemText).then(function() {
                $scope.showSuccess('Media item updated');
                $location.path('/media');
            }).catch(function(err) {
                $scope.showError('Could not update text media', err);
            });
        };
    });

})();