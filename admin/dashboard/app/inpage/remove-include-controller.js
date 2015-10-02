(function() {

    var adminApp = angular.module('adminApp');
    adminApp.controller('RemoveIncludeController', function($log, $scope, $routeParams, pageService) {

        var pageId = $routeParams.pageId;
        var regionName = $routeParams.region;
        var includeIndex =  parseInt($routeParams.include);

        $scope.page = null;
        $scope.removed = false;

        pageService.getPage(pageId).success(function(page) {
            $scope.page = page;
        }).error(function() {
            $scope.err = err;
            $log.error(err, 'Unable to get page: %s', pageId);
        });

        $scope.remove = function() {
            if($scope.page) {
                $scope.page = pageService.removeInclude($scope.page, regionName, includeIndex);
                $scope.page = pageService.depopulatePage($scope.page);
                pageService.updatePage(pageId, $scope.page).success(function() {
                    $scope.removed = true;
                }).error(function(err) {
                    $scope.err = err;
                    $log.error(err, 'Update page to remove include failed (pageId=%s, region=%s, include=%s',
                        pageId, regionName, includeIndex);
                });
            }
        };

        $scope.close = function() {
            window.parent.parent.location.reload();
        };
    });
})();