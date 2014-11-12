(function() {

/**
 *
 * @type {*}
 */
var adminApp = angular.module('adminApp');
adminApp.controller('publishingController', function($scope, $rootScope, $routeParams, $location, publishingService) {
    $rootScope.pageTitle = 'Publishing';

    //get all pages with drafts
    publishingService.getDrafts().then(function(drafts) {
        $scope.drafts = drafts.data;
    }).error(function(err) {
        $rootScope.showError('Error getting drafts to publish', err);
    });

    $scope.cancel = function() {
        $location.path('/');
    };

    $scope.publish = function() {
        var toPublishIds = $scope.drafts.filter(function(page) {
            return page.queued;
        }).map(function(page) {
            return page._id;
        });

        publishingService.publish(toPublishIds).success(function() {
            $rootScope.showSuccess('Publishing successful');
            $location.path('/');
        }).error(function(err) {
            $rootScope.showError('Error performing publish', err);
        });
    };
});

})();