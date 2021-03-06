(function() {

    /**
     *
     * @type {*}
     */
    var adminApp = angular.module('adminApp');
    adminApp.controller('CompareController', function($scope, $routeParams, $location, pageService, publishingService) {

        $scope.getStatusLabel = publishingService.getStatusLabel;
        
        var pageId = $routeParams.pageId;
        $scope.page = null;

        pageService.getPage(pageId).then(function(page) {
            $scope.page = page;
        });
        
        $scope.getPageUrl = function(preview) {
            return `${$scope.page.url}?_preview=${!!preview}`;
        };

        $scope.revertDraft = function () {
            var really = window.confirm('Really discard the draft changes of this page?');
            if(really) {
                publishingService.revertDraft($scope.page._id).then(() => {
                    $scope.showSuccess(`The draft changes to ${$scope.page.name} were discarded`);
                    $location.path('/publishing');
                }).catch(err => {
                    $scope.showError('Error performing publish', err);
                });
            }
        };

        $scope.publish = function() {
            publishingService.publish([ $scope.page._id ]).then(function() {
                $scope.showSuccess('Publishing successful');
                $location.path('/publishing');
            }).catch(function(err) {
                $scope.showError('Error performing publish', err);
            });
        };
    });

})();