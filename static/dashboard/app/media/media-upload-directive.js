
(function() {
    
    var tmpl =
        `<div class="list-group col-sm-11">
            <div class="media-item list-group-item media-file-select" ng-click="selectFiles()">
                <div class="media-item-part clearfix">
                    <input type="file" multiple="true" class="ng-hide">
                    <h3><span class="add-icon">+</span> 
                        <span class="add-text">Add files to library</span>
                        <span class="drop-text">Drop to add files</span>
                    </h3>
                </div>
            </div>
        </div> 

        <form ng-if="files.length > 0" ng-submit="upload(uploadForm)" name="uploadForm" 
              class="form-horizontal media-upload-form" novalidate>
            <div class="list-group col-sm-11">           
                <h3>Prepare media to add</h3>
                <div ng-repeat="file in files" ng-click="showItem(item)" class="media-item list-group-item">   
                        <div class="media-item-part clearfix">
                            <div class="media-item-preview pull-left">
                                <img ng-src="{{getSrcPath(file.item, null, '/_static/dashboard/styles/types/file.png')}}" 
                                     alt="{{file.item.name}}" title="{{file.item.type}}">
                                <span class="item-type" ng-if="!isImage(file.item)">{{getTypeShortName(file.item)}}</span>
                            </div>   
                            <div class="btn-group pull-right">
                                <button type="button" class="btn btn-default" title="Remove"
                                        ng-click="remove(file)" ng-disabled="uploading">
                                    <span class="glyphicon glyphicon-trash"></span>
                                </button>      
                            </div>
                            <div class="media-item-edit">
                                <input placeholder="Name" ng-model="file.item.name" required class="form-control">   
                                <tags-input ng-model="file.item.tags" on-tag-added="addTag($tag)" 
                                            placeholder="Add tags to help manage your files">
                                    <auto-complete source="getMatchingTags($query)"></auto-complete>
                                </tags-input>     
                                <p style="margin-top: 1em"><small>/_media/{{file.name}}</small></p>   
                            </div>                 
                        </div>
                    </div>
                </div>                              
            </div>
            <div class="action-buttons col-sm-11">
                <button type="submit" class="btn btn-primary" ng-disabled="uploading">                    
                    <ng-pluralize count="files.length"
                                  when="{'one': 'Add file', 'other': 'Add {} files'}">
                    </ng-pluralize>
                </button>
                <button ng-click="cancel()" type="button" class="btn btn-default" ng-disabled="uploading">Cancel</button>
            </div>     
        </form>`;
    
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
            controller: function ($scope, $q, $location, mediaService) {

                $scope.uploading = false;
                $scope.isImage = mediaService.isImage;
                $scope.getMimeClass = mediaService.getMimeClass;

                $scope.files = [];

                $scope.remove = function(file) {
                    var selectedFiles = $scope.files;
                    for(var i = selectedFiles.length -1; i >= 0; i--) {
                        if(selectedFiles[i].name === file.name) {
                            selectedFiles.splice(i, 1);
                        }
                    }
                };

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
                        var tooBig = file.size > 1024 * 100; //too big. TODO: inform user

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

                $scope.upload = function() {

                    var formData = new FormData();
                    var i, file;
                    for (i = 0; i < $scope.files.length; i++) {
                        file = $scope.files[i];
                        formData.append('file_' + i, file);
                        formData.append('name_' + i, file.item.name);
                        formData.append('description_' + i , file.item.description);
                        formData.append('tags_' + i, file.item.tags);
                    }

                    mediaService.uploadItem(formData).success(function() {
                        $scope.uploading = true;
                        $scope.showSuccess('Upload successful');
                        $scope.cancel();
                        $scope.getItems();
                    }).error(function(err) {
                        $scope.cancel();
                        $scope.getItems();
                        $scope.showError('Error uploading file', err);
                    }).finally(function() {
                        $scope.uploading = false;
                    });
                    $scope.showInfo('Upload in progress...');
                };

                $scope.cancel = function() {
                    $scope.files = [];
                };
            }
        }
    });

})();