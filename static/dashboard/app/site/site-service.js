(function() {
    var adminApp = angular.module('adminApp');
    adminApp.factory('siteService', function($http) {

        function SiteService() {

        }
        SiteService.prototype.getSite = function() {
            return $http.get('/_api/sites').then(function(res) {
                return res.data[0];
            });
        };

        SiteService.prototype.updateSite = function(siteId, siteData) {
            delete siteData._id;
            return $http.put('/_api/sites/' + siteId, siteData);
        };

        return new SiteService();
    });

})();


