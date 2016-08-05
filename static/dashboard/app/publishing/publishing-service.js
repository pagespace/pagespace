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

        PublishingService.prototype.revertDraft = function(pageId) {
            return $http.put('/_publish/revert', {
                pageId: pageId
            }).then(res => res.data).catch(res => {
                throw errorFactory.createResponseError(res);
            });
        };

        PublishingService.prototype.getStatusLabel = function (page) {
            if(page.published && page.status == 200) {
                return 'update';
            } else if(page.status == 404 || page.status == 410 && page.url != '/') {
                return 'delete';
            } else if(page.status == 301 || page.status == 302 || page.status == 307) {
                return 'redirect';
            } else if(!page.published && page.status == 200) {
                return 'new';
            } else {
                return page.status;
            }
        };

        return new PublishingService();
    });

})();


