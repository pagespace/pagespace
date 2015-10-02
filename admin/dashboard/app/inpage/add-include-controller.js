(function() {

    var adminApp = angular.module('adminApp');
    adminApp.controller('AddIncludeController', function($log, $scope, $routeParams, $q, pageService, pluginService) {

        var pageId = $routeParams.pageId;
        var regionName = $routeParams.region;

        $scope.added = false;
        $scope.selectedPlugin = null;

        var pluginsPromise = pluginService.getPlugins();
        var pagePromise = pageService.getPage(pageId);

        $q.all([pluginsPromise, pagePromise ]).then(function(results) {
            $scope.availablePlugins = results[0].data;
            $scope.page = results[1].data;

            $log.debug('Got available plugins and page ok');
        }).catch(function() {
            $scope.err = err;
            $log.error(err, 'Unable to get data');
        });

        $scope.selectPlugin = function(plugin) {
            $scope.selectedPlugin = plugin;
        };

        $scope.addInclude = function() {

            //map region name to index
            var regionIndex = null;
            for(var i = 0; i < $scope.page.regions.length && regionIndex === null; i++) {
                if($scope.page.regions[i].name === regionName) {
                    regionIndex = i;
                }
            }

            //add the new include to the region
            if(typeof regionIndex === 'number' && $scope.selectedPlugin) {
                $scope.page.regions[regionIndex].includes.push({
                    plugin: $scope.selectedPlugin,
                    data: $scope.selectedPlugin.defaultData || {}
                });

                //save
                $scope.page = pageService.depopulatePage($scope.page);
                pageService.updatePage(pageId, $scope.page).success(function() {
                    $scope.added = true;
                }).error(function(err) {
                    $log.error(err, 'Update page to add include failed (pageId=%s, region=%s)', pageId, region);
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