(function() {
    var adminApp = angular.module('adminApp');
    adminApp.factory('publishingService', function($http, pageService) {

        function PublishingService() {

        }
        PublishingService.prototype.getDrafts = function() {
            return pageService.getPages({
                draft: true
            })
        };

        PublishingService.prototype.publish = function(ids) {
            return $http.post(ids);
        };

        return new PublishingService();
    });

})();


