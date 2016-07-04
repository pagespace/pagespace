
(function() {
    
    var tmpl =
        `<form ng-if="files.length > 0" ng-submit="upload(uploadForm)" name="uploadForm" 
              class="form-horizontal media-upload-form" novalidate>
            <div class="list-group col-sm-11">                     
                <div class="notification-bar">
                    <h4>Prepare media to add</h4>
                </div>
                <div ng-repeat="file in files" ng-click="showItem(item)" class="media-item list-group-item">   
                        <div class="media-item-part clearfix">
                            <div class="btn-group pull-right">
                                <button type="button" class="btn btn-default" title="Remove" tabindex="-1"
                                        ng-click="remove(file)" ng-disabled="uploading">
                                    <span class="glyphicon glyphicon-trash"></span>
                                </button>      
                            </div>
                            <div class="media-item-preview">
                                <img ng-src="{{getSrcPath(file.item, null, '/_static/dashboard/styles/types/file.png')}}" 
                                     alt="{{file.item.name}}" title="{{file.item.type}}">
                                <span class="item-type" ng-if="!isImage(file.item)">{{getTypeShortName(file.item)}}</span>
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
    adminApp.directive('mediaPreview', function() {
        return {
            scope: true,
            template: tmpl,
            controller: function ($scope, $window, $q, $location, mediaService) {

                $scope.uploading = false;
                $scope.isImage = mediaService.isImage;
                $scope.getMimeClass = mediaService.getMimeClass;

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

                $scope.upload = function() {

                    if($scope.files.length > 4) {
                        var msg = 'Are you ready to upload the chosen files?';
                        if (!$window.confirm(msg)) {
                            return;
                        }
                    }

                    var formData = new FormData();
                    var i, file;
                    for (i = 0; i < $scope.files.length; i++) {
                        file = $scope.files[i];
                        formData.append('file_' + i, file);
                        formData.append('name_' + i, file.item.name);
                        formData.append('description_' + i , file.item.description);
                        formData.append('tags_' + i, JSON.stringify(file.item.tags));
                    }

                    mediaService.uploadItem(formData).then(function() {
                        $scope.uploading = true;
                        $scope.showSuccess('Upload successful');
                    }).catch(function(err) {
                        $scope.showError('Error uploading file', err);
                    }).finally(function() {
                        $scope.clearFiles();
                        $scope.getItems();
                        $scope.uploading = false;
                    });
                    $scope.showInfo('Upload in progress...');
                };

                $scope.cancel = function() {
                    if($scope.files.length > 4) {
                        var msg = 'Really cancel this upload?';
                        if ($window.confirm(msg)) {
                            $scope.clearFiles();
                        }
                    } else {
                        $scope.clearFiles();
                    }
                };

                var confirmExitMsg = 'There are files ready to upload. Are you sure you want to navigate away?';
                $scope.$on('$locationChangeStart', function (ev) {
                    if ($scope.files.length > 0 && !$window.confirm(confirmExitMsg)) {
                        ev.preventDefault();
                    }
                });

                $window.onbeforeunload = function() {
                    return $scope.files.length > 0 ? confirmExitMsg : undefined;
                }
            }
        }
    });

})();