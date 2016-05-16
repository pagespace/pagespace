
(function() {
    
    var tmpl =
        `<h3 style="margin-left: -15px">Media library</h3>
         <div ng-repeat="item in filteredItems" class="row media-item">          
            <div class="col-sm-10">
                <div class="media-item-part clearfix">
                    <div class="media-item-preview" style="cursor: pointer;">
                        <img ng-src="{{getSrcPath(item, 'thumb', '/_static/dashboard/styles/types/file.png')}}" 
                             ng-click="!item._editing ? showItem(item) : ''" 
                             alt="{{item.name}}">
                        <span class="item-type" ng-if="!isImage(item)">{{getType(item)}}</span>
                    </div>     
                    <div ng-if="!item._editing"> 
                        <h3>{{item.name}}</h3>
                        <p><span class="label label-primary" ng-repeat="tag in item.tags" 
                              style="margin-right: 8px; display: inline-block">{{tag.text}}</span></p>                        
                    </div>
                    <div ng-if="item._editing" class="media-item-edit">
                        <input placeholder="Name" ng-model="item.name" required class="form-control">
                        <tags-input ng-model="item.tags" on-tag-added="addTag($tag)" placeholder="Add tags to help manage your files">
                            <auto-complete source="getMatchingTags($query)"></auto-complete>
                        </tags-input>         
                    </div>   
                </div>                               
            </div>
            <div class="col-sm-2">
                <div class="btn-group media-item-controls media-item-part">
                    <button type="button" class="btn btn-default" 
                            ng-show="item._editing" ng-click="revertItem(item)">Cancel</button>
                    <button type="button" class="btn btn-primary" 
                            ng-show="item._editing" ng-click="updateItem(item)">Update</button>
                    
                    <button type="button" class="btn btn-default" title="Edit" 
                            ng-show="!item._editing" ng-click="item._editing = !item._editing">
                        <span class="glyphicon glyphicon-wrench"></span>
                    </button>      
                    <button type="button" class="btn btn-default" title="Delete" 
                            ng-show="!item._editing" ng-click="deleteItem(item)">
                        <span class="glyphicon glyphicon-trash"></span>
                    </button> 
                </div>                
            </div>
        </div>
        <p style="margin-left: -15px" ng-if="!mediaItems.length">The media library is empty</p>
        <p style="margin-left: -15px" ng-if="mediaItems.length && !filteredItems.length">No items match this filter</p>`;
    
    var adminApp = angular.module('adminApp');
    adminApp.directive('mediaItems', function() {
        return {
            scope: true,
            template: tmpl,
            link: function link(scope, element, mediaService) {

                //  scope.isImage = mediaService.isImage;
            },
            controller: function($log, $scope, $location, mediaService) {
                
                $scope.isImage = mediaService.isImage;
                $scope.getMimeClass = mediaService.getMimeClass;

                $scope.getItems();

                $scope.showItem = function(item) {
                    $location.path('/media/' + item._id);
                };

                $scope.deleteItem = function(item) {
                    var really = window.confirm('Really delete the item, ' + item.name + '?');
                    if(really) {
                        mediaService.deleteItem(item._id).success(function() {
                            $scope.getItems();
                            $scope.showInfo('Media: ' + item.name + ' removed.');
                        }).error(function(err) {
                            $scope.showError('Error deleting page', err);
                        });
                    }
                };

                $scope.revertItem = function (item) {
                    mediaService.getItem(item._id).success(function(itemFromServer) {
                        item.name = itemFromServer.name;
                        item.tags = itemFromServer.tags;
                        item._editing = false;
                    }).error(function(err) {
                        $scope.showError('Error reverting item', err);
                    });
                };

                $scope.updateItem = function (item) {
                    mediaService.updateItem(item._id, item).success(function() {
                        item._editing = false;
                    }).error(function(err) {
                        $scope.showError('Error udpdating item', err);
                    });
                }


            }
        };
    });

})();