(function() {
    var adminApp = angular.module('adminApp');
    adminApp.factory('siteService', function($http) {

        function SiteService() {

        }
        SiteService.prototype.getSite = function() {
            return $http.get('/_api/sites/1');
        };

        SiteService.prototype.updateSite = function(siteData) {
            return $http.put('/_api/sites/1', siteData);
        };

        return new SiteService();
    });

})();


