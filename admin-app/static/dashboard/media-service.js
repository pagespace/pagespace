(function() {
    var adminApp = angular.module('adminApp');
    adminApp.factory('mediaService', function($http) {

        function MediaService() {
        }
        MediaService.prototype.getItems = function() {
            return $http.get('/_api/media');
        };
        MediaService.prototype.getItem = function(mediaId) {
            return $http.get('/_api/media/' + mediaId);
        };

        MediaService.prototype.createItem = function(mediaData) {
            return $http.post('/_api/media', mediaData);
        };

        MediaService.prototype.deleteItem = function(mediaId) {
            return $http.delete('/_api/media/' + mediaId);
        };

        MediaService.prototype.isImage = function(item) {
            return item && !!item.type.match(/image\/[jpeg|png|gif]/);
        };

        MediaService.prototype.uploadItem = function(file, mediaData) {
            var formData = new FormData();
            formData.append("file", file);
            formData.append("name", mediaData.name);
            formData.append("description", mediaData.description);
            formData.append("tags", mediaData.tags);

            //store upload in session, then accept media data
            return $http.post('/_media', formData, {
                withCredentials: true,
                headers: { 'Content-Type': undefined },
                transformRequest: angular.identity
            });
        };

        return new MediaService();
    });

})();

