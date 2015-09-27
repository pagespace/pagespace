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

        MediaService.prototype.updateItemText = function(mediaData, content) {
            return $http.put('/_media/' + mediaData.fileName, {
                content: content
            });
        };

        MediaService.prototype.deleteItem = function(mediaId) {
            return $http.delete('/_api/media/' + mediaId);
        };

        MediaService.prototype.uploadItem = function(file, mediaData) {
            var formData = new FormData();
            formData.append('file', file);
            formData.append('name', mediaData.name);
            formData.append('description', mediaData.description);
            formData.append('tags', mediaData.tags);

            //store upload in session, then accept media data
            return $http.post('/_media', formData, {
                withCredentials: true,
                headers: { 'Content-Type': undefined },
                transformRequest: angular.identity
            });
        };
        MediaService.prototype.getItemText = function(item) {
            return $http.get('/_media/' + item.fileName);
        };

        //some utils
        MediaService.prototype.isImage = function(item) {
            return item && !!item.type.match(/^image/);
        };
        MediaService.prototype.isText = function(item) {
            return item && !!item.type.match(/text\/[plain|json|html]/);
        };
        MediaService.prototype.isDocument = function(item) {
            return item && !!item.type.match(/application\/pdf/);
        };

        MediaService.prototype.getMimeClass = function(item) {
            return 'media-' + item.type.split('/')[1];
        };

        MediaService.prototype.getSrcPath = function(item) {
            return item &&  item.fileName ? '/_media/' + item.fileName : null;
        };


        /* jshint ignore:start */
        //thanks http://stackoverflow.com/a/14919494/200113
        MediaService.prototype.humanFileSize = function(bytes) {
            var exp = Math.log(bytes) / Math.log(1024) | 0;
            var result = (bytes / Math.pow(1024, exp)).toFixed(2);

            return result + ' ' + (exp == 0 ? 'bytes': 'KMGTPEZY'[exp - 1] + 'B');
        };
        /* jshint ignore:end */

        return new MediaService();
    });

})();


