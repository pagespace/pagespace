(function() {
    var adminApp = angular.module('adminApp');
    adminApp.factory('siteService', function($http) {

        function SiteService() {

        }
        SiteService.prototype.getSite = function() {
            return $http.get('/_api/sites').then(res => res.data[0]).catch(res => res.data);
        };

        SiteService.prototype.updateSite = function(siteId, siteData) {
            delete siteData._id;
            return $http.put('/_api/sites/' + siteId, siteData).then(res => res.data).catch(res => res.data);
        };

        return new SiteService();
    });

})();


