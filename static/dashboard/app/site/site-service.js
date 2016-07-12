(function() {
    var adminApp = angular.module('adminApp');
    adminApp.factory('siteService', function($http, errorFactory) {

        function SiteService() {

        }
        SiteService.prototype.getSite = function() {
            return $http.get('/_api/sites').then(res => res.data[0]).catch(res => {
                throw errorFactory.createResponseError(res);
            });
        };

        SiteService.prototype.updateSite = function(siteId, siteData) {
            delete siteData._id;
            return $http.put('/_api/sites/' + siteId, siteData).then(res => res.data).catch(res => {
                throw errorFactory.createResponseError(res);
            });
        };

        return new SiteService();
    });

})();


