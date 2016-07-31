(function() {

    var adminApp = angular.module('adminApp');
    adminApp.controller('AddIncludeController', function($log, $scope, $routeParams, pageService, pluginService) {

        var pageId = $routeParams.pageId;
        var regionName = $routeParams.region;
        
        $scope.selectedPlugin = null;

        var pluginsPromise = pluginService.getPlugins();
        var pagePromise = pageService.getPage(pageId);

        Promise.all([pluginsPromise, pagePromise ]).then(function(results) {
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

        $scope.addInclude = function() {

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
                    pageService.addIncludeToPage(page, regionIndex, $scope.selectedPlugin, includeData);
                    page = pageService.depopulatePage(page);
                    return pageService.updatePage(pageId, page);
                }).then(function() {
                    $scope.close();
                }).catch(function(err) {
                    $log.error(err, 'Update page to add include failed (pageId=%s, region=%s)', pageId, regionIndex);
                });
            } else {
                $log.error('Unable to determine region index for new include (pageId=%s, region=%s)',
                    pageId, regionName);
            }
        };

        $scope.close = function() {
            window.parent.parent.location.reload();
        };
    });
})();