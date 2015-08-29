(function() {

/**
 *
 * @type {*}
 */
var adminApp = angular.module('adminApp');
adminApp.controller("DeletePageController",
    function($scope, $rootScope, $routeParams, $location, $timeout,
             pageService, templateService, partService, $window) {

    var pageId = $routeParams.pageId;
    $scope.status = 410;

    pageService.getPage(pageId).success(function(page) {
        $scope.page = page;

        //default delete status
        page.status = 410;
    }).error(function(err) {
        $rootScope.showError('Couldn\'t find a page to delete', err);
    });
    pageService.getPages().success(function(pages) {
        $scope.pages = pages;
    }).error(function(err) {
        $rootScope.showError('Couldn\'t get pages', err);
    });

    $scope.cancel = function() {
        $location.path("");
    };

    $scope.submit = function(form) {

        if(form.$invalid) {
            $scope.submitted = true;
            $window.scrollTo(0,0);
            return;
        }

        var page = $scope.page;

        pageService.deletePage(page).success(function() {
            $location.path("");
            $rootScope.showInfo("Page: " + page.name + " removed.");
        }).error(function(err) {
            $rootScope.showError("Error deleting page", err);
        });
    }
});

})();