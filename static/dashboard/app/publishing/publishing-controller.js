(function() {

/**
 *
 * @type {*}
 */
var adminApp = angular.module('adminApp');
adminApp.controller('PublishingController', function($scope, $rootScope, $routeParams, $window, $location,
                                                     publishingService) {

    $scope.getStatusLabel = publishingService.getStatusLabel;

    var preQueued = $routeParams.pageId || null;

    $scope.drafts = [];

    //get all pages with drafts
    publishingService.getDrafts().then(function(drafts) {
        $scope.drafts = drafts;

        drafts.forEach(function(page) {
           if(page._id === preQueued) {
               page.queued = true;
           }
        });
    }).catch(function(err) {
        $scope.showError('Error getting drafts to publish', err);
    });

    $scope.queueAll = function() {
        for(let page of $scope.drafts) {
            $scope.queueToPublish(page, true);
        }
    };
    $scope.unqueueAll = function() {
        for(let page of $scope.drafts) {
            $scope.queueToPublish(page, false);
        }
    };
    
    $scope.queueToPublish = function(page, force) {
        page.queued = typeof force ==='boolean' ? force : !page.queued;
    };

    $scope.numQueued = function() {
        return $scope.drafts.reduce((prev, curr) => curr.queued ? ++prev : prev, 0);
    };

    $scope.showCompare = function(page) {
        $location.path('/publishing/compare/' + page._id);
    };

    $scope.cancel = function() {
        $location.path('/pages');
    };

    $scope.publish = function() {
        var toPublishIds = $scope.drafts.filter(function(page) {
            return page.queued;
        }).map(function(page) {
            return page._id;
        });

        if(toPublishIds.length === 0) {
            $window.scrollTo(0,0);
            $scope.submitted = true;
            return;
        }

        publishingService.publish(toPublishIds).then(function() {
            $scope.showSuccess('Publishing successful');
            $location.path('/');
        }).catch(function(err) {
            $scope.showError('Error performing publish', err);
        });
    };
});

})();