(function() {

    /**
     *
     * @type {*}
     */
    var adminApp = angular.module('adminApp');
    adminApp.controller('SiteSettingsController', function($scope, $rootScope, $location, $window, siteService) {
        
        siteService.getSite().then(function(site) {
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

            siteService.updateSite(site._id, site).then(function() {
                $location.path('/');
            }).catch(function(err) {
                $scope.showError('Error updating site', err);
            });
        };
    });

})();