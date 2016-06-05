
(function() {
    
    var tmpl =
        `
         <div class="list-group col-sm-11">
            <div class="notification-bar">
                <h4>Media library</h4>
            </div>
             <div ng-repeat="item in filteredItems" class="media-item list-group-item">    
                <div class="media-item-part clearfix">
                    <div class="media-item-preview pull-left" style="cursor: pointer;">
                        <img ng-src="{{getSrcPath(item, 'thumb', '/_static/dashboard/styles/types/file.png')}}" 
                             ng-click="!item._editing ? showItem(item) : ''" 
                             alt="{{item.name}}" title="{{item.type}}">
                        <span class="item-type" ng-if="!isImage(item)">{{getTypeShortName(item)}}</span>
                    </div>  
                    <div class="btn-group pull-right">
                        <button type="button" class="btn btn-default" title="Cancel"
                                ng-show="item._editing" ng-click="revertItem(item)">
                            <span class="glyphicon glyphicon glyphicon-remove"></span>
                        </button>
                        <button type="button" class="btn btn-primary" title="Update"
                                ng-show="item._editing" ng-click="updateItem(item)">                                
                            <span class="glyphicon glyphicon glyphicon-ok"></span>
                        </button>
                        
                        <button type="button" class="btn btn-default" title="Edit" 
                                ng-show="!item._editing" ng-click="item._editing = !item._editing">
                            <span class="glyphicon glyphicon-pencil"></span>
                        </button>      
                        <button type="button" class="btn btn-default" title="Delete" 
                                ng-show="!item._editing" ng-click="deleteItem(item)">
                            <span class="glyphicon glyphicon-trash"></span>
                        </button> 
                    </div>     
                    <div ng-if="!item._editing" class="media-item-view"> 
                        <h3>{{item.name}}</h3>
                        <p><span class="label label-primary" ng-repeat="tag in item.tags">{{tag.text}}</span></p>       
                        <p><small><a href="/_media/{{item.fileName}}" target="_blank">/_media/{{item.fileName}}</a></small></p>                                         
                    </div>
                    <div ng-if="item._editing" class="media-item-edit">
                        <input placeholder="Name" ng-model="item.name" required class="form-control">
                        <tags-input ng-model="item.tags" on-tag-added="addTag($tag)" placeholder="Add tags to help manage your files">
                            <auto-complete source="getMatchingTags($query)"></auto-complete>
                        </tags-input>         
                    </div>   
                </div>                                                          
            </div>
            <p ng-if="!mediaItems.length">The media library is empty</p>
            <p ng-if="mediaItems.length && !filteredItems.length">No items match this filter</p>
        </div>`;
    
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
                        mediaService.deleteItem(item.fileName).then(function() {
                            $scope.getItems();
                            $scope.showInfo('Media: ' + item.name + ' removed.');
                        }).catch(function(err) {
                            $scope.showError('Error deleting page', err);
                        });
                    }
                };

                $scope.revertItem = function (item) {
                    mediaService.getItem(item._id).then(function(itemFromServer) {
                        item.name = itemFromServer.name;
                        item.tags = itemFromServer.tags;
                        item._editing = false;
                    }).catch(function(err) {
                        $scope.showError('Error reverting item', err);
                    });
                };

                $scope.updateItem = function (item) {
                    mediaService.updateItem(item._id, item).then(function() {
                        item._editing = false;
                    }).catch(function(err) {
                        $scope.showError('Error udpdating item', err);
                    });
                }


            }
        };
    });

})();