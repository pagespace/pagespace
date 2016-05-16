
(function() {
    
    var tmpl =
        `<div class="row media-item media-file-select" ng-click="selectFiles()">
            <div class="col-sm-12">
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
            <h3 style="margin-left: -15px">Prepare media to upload</h3>
            <div ng-repeat="file in files" ng-click="showItem(item)" class="row media-item">
                <div class="col-sm-10">
                    <div class="media-item-part clearfix">
                        <div class="media-item-preview">
                            <img ng-src="{{getSrcPath(file.item, null, '/_static/dashboard/styles/types/file.png')}}" alt="{{file.item.name}}">
                            <span class="item-type" ng-if="!isImage(file.item)">{{getType(file.item)}}</span>
                        </div>     
                        <div class="media-item-edit">
                            <input placeholder="Name" ng-model="file.item.name" required class="form-control">   
                            <tags-input ng-model="file.item.tags" on-tag-added="addTag($tag)" 
                                        placeholder="Add tags to help manage your files">
                                <auto-complete source="getMatchingTags($query)"></auto-complete>
                            </tags-input>                        
                        </div>                 
                    </div>
                </div>
                <div class="col-sm-2">
                    <div class="btn-group media-item-controls media-item-part">
                        <button type="button" class="btn btn-default" ng-click="remove(file)" title="Remove">
                            <span class="glyphicon glyphicon-trash"></span>
                        </button>      
                    </div>
                </div>
            </div>
            
            <div class="row">
                <div class="action-buttons">
                    <button type="submit" class="btn btn-primary">                    
                        <ng-pluralize count="files.length"
                                      when="{'one': 'Add file', 'other': 'Add {} files'}">
                        </ng-pluralize>
                    </button>
                    <button ng-click="cancel()" type="button" class="btn btn-default">Cancel</button>
                </div>                
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

                        if(existingFilePaths.indexOf(file.name) > -1) {
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
                        $location.path('/media');
                        $scope.showSuccess('Upload successful');
                        $scope.cancel();
                        $scope.getItems();
                    }).error(function(err) {
                        $scope.cancel();
                        $scope.getItems();
                        $scope.showError('Error uploading file', err);
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