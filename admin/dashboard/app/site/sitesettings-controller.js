(function() {

    /**
     *
     * @type {*}
     */
    var adminApp = angular.module('adminApp');
    adminApp.controller("SiteSettingsController", function($scope, $rootScope, $location, $window, siteService) {
        $rootScope.pageTitle = "Site settings";

        siteService.getSite().success(function(site) {
            $scope.site = site;
        });

        $scope.cancel = function() {
            $location.path('/');
        };

        $scope.save = function(form) {

            if(form.$invalid) {
                $window.scrollTo(0,0);
                $scope.submitted = true;
                return;
            }
            var site = $scope.site;

            siteService.updateSite(site).success(function() {
                $rootScope.showSuccess('Site updated.');
                $location.path('/');
            }).error(function(err) {
                $rootScope.showError('Error updating site', err);
            });
        };
    });

})();