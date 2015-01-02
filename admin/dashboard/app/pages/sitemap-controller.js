(function() {

/**
 *
 * @type {*}
 */
var adminApp = angular.module('adminApp');
adminApp.controller("SitemapController", function($scope, $rootScope, $location, siteService, pageService) {

    $rootScope.pageTitle = "Sitemap";

    var getSite = function() {
        siteService.getSite().success(function(site) {
            $scope.site = site;
        }).error(function(err) {
            $rootScope.showError("Error getting site", err);
        });
    };

    var getPages = function() {
        pageService.getPages().success(function(allPages){

            var pageMap = {};
            allPages = allPages.filter(function(page) {
                return page.status < 400;
            });
            allPages.forEach(function(page) {
                pageMap[page._id] = page;
            });

            var populateChildren = function(pages) {

                pages.forEach(function(currentPage) {

                    currentPage.children = allPages.filter(function(childCandidate) {
                        var candidateParentId = childCandidate.parent ? childCandidate.parent._id : null;
                        return currentPage._id === candidateParentId;
                    });
                    if(currentPage.children.length > 0) {
                        populateChildren(currentPage.children);
                    }
                });
            };

            var primaryRoots = allPages.filter(function(page) {
                return page.root === "primary";
            });
            populateChildren(primaryRoots);

            $scope.pages = primaryRoots;
        }).error(function(err) {
            $rootScope.showError("Error getting pages", err);
        });
    };

    getSite();
    getPages();

    $scope.addPage = function(parentPage) {

        var parentPageId = '';
        if(parentPage) {
            parentPageId = '/' + parentPage._id;
        }
        $location.path('/pages/new' + parentPageId);
    };

    $scope.removePage = function(page) {

        $location.path('/pages/delete/' + page._id);
    };
});

})();