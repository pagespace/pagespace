(function() {
    var adminApp = angular.module('adminApp');
    adminApp.factory('publishingService', function($http, pageService, errorFactory) {

        function PublishingService() {

        }
        PublishingService.prototype.getDrafts = function() {
            return pageService.getPages({
                draft: true
            });
        };

        PublishingService.prototype.publish = function(draftIds) {
            return $http.post('/_publish/pages', draftIds).then(res => res.data).catch(res => {
                throw errorFactory.createResponseError(res);
            });
        };

        return new PublishingService();
    });

})();


