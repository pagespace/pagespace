(function() {
    var adminApp = angular.module('adminApp');
    adminApp.factory('mediaService', function($http, $log) {

        function MediaService() {
        }

        MediaService.prototype.getItems = function() {
            return $http.get('/_api/media');
        };

        MediaService.prototype.getItem = function(mediaId) {
            return $http.get('/_api/media/' + mediaId);
        };

        MediaService.prototype.updateItem = function(mediaId, mediaData) {
            return $http.put('/_api/media' + mediaId, mediaData);
        };

        MediaService.prototype.updateItemText = function(mediaData, content) {
            return $http.put('/_media/' + mediaData.fileName, {
                content: content
            });
        };

        MediaService.prototype.deleteItem = function(mediaId) {
            return $http.delete('/_api/media/' + mediaId);
        };

        MediaService.prototype.uploadItem = function(formData) {
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

        MediaService.prototype.getImageVariations = function() {
            return $http.get('/_dashboard/settings').then(function(res) {
                var settings = res.data;
                return settings.imageVariations || [];
            });
        };

        //some utils
        MediaService.prototype.isImage = function(item) {
            return item && item.type && !!item.type.match(/^image/);
        };
        MediaService.prototype.isText = function(item) {
            return item && item.type && !!item.type.match(/text\/[plain|json|html]/);
        };
        MediaService.prototype.isDocument = function(item) {
            return item && item.type && !!item.type.match(/application\/pdf/);
        };

        MediaService.prototype.getMimeClass = function(item) {
            return 'media-' + item.type.split('/')[1];
        };

        MediaService.prototype.getSrcPath = function(item, label, fallback) {
            var src = null;

            if(this.isImage(item)) {
                if(item.fileSrc) {
                    src = item.fileSrc;
                } else if(item.fileName) {
                    src = '/_media/' + item.fileName;
                    if(label) {
                        src += '?label=' + label;
                    }
                }
            } else {
                src = fallback;
            }
            
            return src;
        };

        MediaService.prototype.getType = function(item) {
            try {
                return item.type.split('/')[1].toUpperCase();    
            } catch(err) {
                $log.warn(err);
                return '???';
            }
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


