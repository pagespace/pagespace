
(function() {
    
    var tmpl =
        `<div class="media-file-select" ng-click="selectFiles()">
            <input type="file" multiple="true" class="ng-hide">
            <button class="btn btn-link">
                <span class="glyphicon glyphicon-plus"></span>
                <span class="add-text">Add files to library</span>
                <span class="drop-text">Drop to add files</span>
            </button>
        </div>`;
    
    var adminApp = angular.module('adminApp');
    adminApp.directive('mediaUpload', function() {
        return {
            scope: true,
            template: tmpl,
            link: function link(scope, element) {

                var rootEl = element[0];

                var fileInputEl = rootEl.querySelector('input');
                fileInputEl.addEventListener('change', function () {
                    scope.setFiles(this.files);
                    fileInputEl.value = '';
                });

                scope.selectFiles = function() {
                    setTimeout(function() {
                        fileInputEl.click();
                    }, 0);

                };

                var dragCounter = 0;
                rootEl.addEventListener('dragenter', function(ev) {
                    dragCounter++;
                    this.classList.add('media-item-dragging');
                    ev.preventDefault();
                });
                rootEl.addEventListener('dragover', function(ev) {
                    ev.dataTransfer.dropEffect = 'copy';
                    ev.preventDefault();
                });
                rootEl.addEventListener('dragleave', function(ev) {
                    dragCounter--;
                    if(dragCounter === 0) {
                        this.classList.remove('media-item-dragging');
                        ev.preventDefault();
                    }
                });

                rootEl.addEventListener("drop", function(ev) {
                    ev.stopPropagation();
                    ev.preventDefault();

                    var dt = ev.dataTransfer;
                    scope.setFiles(dt.files);
                    fileInputEl.value = '';
                    this.classList.remove('media-item-dragging');
                }, false);
            },
            controller: function ($scope, $window, $q, $location, mediaService) {

                $scope.uploading = false;
                $scope.isImage = mediaService.isImage;
                $scope.getMimeClass = mediaService.getMimeClass;

                function generateName(fileName) {
                    return fileName.split('.')[0].split(/-|_/).map(function (part) {
                        return part.charAt(0).toUpperCase() + part.slice(1);
                    }).join(' ');
                }

                $scope.setFiles = function(newFiles) {
                    var existingFilePaths = $scope.files.map(function(file) { return file.name });

                    for (var i = 0; i < newFiles.length; i++) {
                        var file = newFiles[i];

                        var alreadySelected = existingFilePaths.indexOf(file.name) > -1; //already selected
                        var tooBig = file.size > 1024 * 1024 * 100; //too big. TODO: inform user

                        if(alreadySelected || tooBig) {
                            continue;
                        }

                        file.item = {
                            fileSrc: null,
                            type: file.type,
                            tags : []
                        };
                        if(mediaService.isImage(file)) {
                            (function(file) {
                                var reader = new FileReader();
                                reader.readAsDataURL(file);
                                reader.onload = function (e) {
                                    file.item.fileSrc = e.target.result;
                                    $scope.$apply();
                                };
                            }(file));
                        }

                        file.item.name = generateName(file.name);
                        $scope.files.push(file);
                    }
                };
            }
        }
    });

})();