(function() {
    var adminApp = angular.module('adminApp');
    adminApp.factory('mediaService', function($http, $log, errorFactory) {
        
        var mimeTypeShortNames = {
            'audio/basic' : 'audio',
            'video/msvideo' : 'video',
            'video/avi' : 'video',
            'image/bmp' : 'bitmap',
            'text/css' : 'css',
            'application/msword' : 'word',
            'image/gif' : 'gif',
            'application/x-gzip' : 'gzip',
            'text/html' : 'html',
            'image/jpeg' : 'jpeg',
            'application/x-javascript':  'js',
            'audio/x-midi' : 'midi',
            'video/mpeg' : 'video',
            'audio/vorbis' : 'ogg',
            'application/ogg' : 'ogg',
            'application/pdf' : 'pdf',
            'image/png' : 'png',
            'application/vnd.openxmlformats-officedocument.presentationml.presentation' : 'ppt',
            'video/quicktime' : 'qt',
            'image/svg+xml' : 'svg',
            'application/x-shockwave-flash' : 'flash',
            'application/x-tar' : 'tar',
            'image/tiff' : 'tar',
            'text/plain' : 'text',
            'audio/wav, audio/x-wav' : 'wav',
            'application/vnd.ms-excel' : 'excel',
            'application/xml' : 'xml',
            'application/zip' : 'zip'
        };

        function MediaService() {
        }

        MediaService.prototype.getItems = function() {
            return $http.get('/_api/media').then(res => res.data).catch(res => {
                throw errorFactory.createResponseError(res);
            });
        };

        MediaService.prototype.getItem = function(mediaId) {
            return $http.get('/_api/media/' + mediaId).then(res => res.data).catch(res => {
                throw errorFactory.createResponseError(res);
            });
        };

        MediaService.prototype.updateItem = function(mediaId, mediaData) {
            return $http.put('/_api/media' + mediaId, mediaData).then(res => res.data).catch(res => {
                throw errorFactory.createResponseError(res);
            });
        };

        MediaService.prototype.updateItemText = function(mediaData, content) {
            return $http.put('/_media/' + mediaData.fileName, {
                content: content
            }).then(res => res.data).catch(res => {
                throw errorFactory.createResponseError(res);
            });
        };

        MediaService.prototype.deleteItem = function(fileName) {
            return $http.delete('/_media/' + fileName).then(res => res.data).catch(res => {
                throw errorFactory.createResponseError(res);
            });
        };

        MediaService.prototype.uploadItem = function(formData) {
            //store upload in session, then accept media data
            return $http.post('/_media', formData, {
                withCredentials: true,
                headers: { 'Content-Type': undefined },
                transformRequest: angular.identity
            }).then(res => res.data).catch(res => {
                throw errorFactory.createResponseError(res);
            });
        };

        MediaService.prototype.getItemText = function(item) {
            return $http.get('/_media/' + item.fileName).then(res => res.data).catch(res => {
                throw errorFactory.createResponseError(res);
            });
        };

        MediaService.prototype.getImageVariations = function() {
            return $http.get('/_dashboard/settings').then(function(res) {
                var settings = res.data;
                return settings.imageVariations || [];
            }).then(res => res.data).catch(res => {
                throw errorFactory.createResponseError(res);
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

        MediaService.prototype.getTypeShortName = function(item) {
            
            if(mimeTypeShortNames[item.type]) {
                return mimeTypeShortNames[item.type];
            }
            
            try {
                return item.fileName.split('\.')[1].toLowerCase();
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


