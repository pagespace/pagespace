(function() {

    const
        adminApp = angular.module('adminApp'),

        TMPL =
            `<div>
                <div class="notification-bar">
                    <p ng-show="availablePlugins.length == 0">No plugins have been imported</p>
                </div>
                <div class="list-group" ng-show="availablePlugins.length > 0">
                    <li ng-click="selectPlugin(plugin)" ng-repeat="plugin in availablePlugins"
                        class="list-group-item" ng-class="{active: selectedPlugin == plugin}" style="cursor: pointer">
                        <h4 class="list-group-item-heading">{{plugin.name}}</h4>
                    </li>
                </div>
            </div>`;

    adminApp.directive('addInclude', function() {
        return {
            scope: {
                pageId: '=',
                regionName: '='
            },
            replace: true,
            template: TMPL,
            controller: function($log, $scope, $timeout, $q, pageService, pluginService) {

                let regionName = null;
                var pageId = $scope.pageId;
                regionName = $scope.regionName;

                $scope.selectedPlugin = null;

                var pluginsPromise = pluginService.getPlugins();
                var pagePromise = pageService.getPage(pageId);

                $q.all([pluginsPromise, pagePromise ]).then(function(results) {
                    $scope.availablePlugins = results[0];
                    $scope.page = results[1];

                    $log.debug('Got available plugins and page ok');
                }).catch(function(err) {
                    $scope.err = err;
                    $log.error(err, 'Unable to get data');
                });

                $scope.selectPlugin = function(plugin) {
                    $scope.selectedPlugin = plugin;
                };
                
                $scope.$on('include-added', () => {
                    var page = $scope.page;

                    //map region name to index
                    var regionIndex = pageService.getRegionIndex(page, regionName);

                    //add a new region
                    if(regionIndex === null) {
                        pageService.addRegion(page, regionName);
                    }

                    //add the new include to the region
                    if($scope.selectedPlugin) {
                        pageService.createIncludeData($scope.selectedPlugin).then(function(includeData) {
                            
                            $scope.$emit('edit-include', 
                                pageId, $scope.selectedPlugin.name, includeData._id, regionName);
                            
                            pageService.addIncludeToPage(page, regionIndex, $scope.selectedPlugin, includeData);
                            page = pageService.depopulatePage(page);
                            return pageService.updatePage(pageId, page);
                        }).catch(function(err) {
                            const msg = `Update page to add include failed (pageId=${pageId}, region=${regionIndex})`;
                            $log.error(err, msg);
                        });
                    } else {
                        const msgDetails = `pageId=${pageId}, region=${regionName}`;
                        $log.error(`Unable to determine region for new include (${msgDetails})`);
                    }
                });
            }
        };
    });
})();