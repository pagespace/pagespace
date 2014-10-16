(function() {

/**
 *
 * @type {*}
 */
var adminApp = angular.module('adminApp');
adminApp.controller("sitemapController", function($scope, $rootScope, $location, pageService) {

    $rootScope.pageTitle = "Sitemap";

    var getPages = function() {
        pageService.getPages().success(function(allPages){

            var pageMap = {};
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
        });
    };

    getPages();

    $scope.addPage = function(parentPage) {

        parentPage = parentPage || 'primary';
        pageService.createPage(null, parentPage).success(function() {
            getPages();
        });
    };

    $scope.removePage = function(page) {

        var really = window.confirm('Really delete the page, ' + page.name + '?');
        if(really) {
            pageService.deletePage(page._id).success(function() {
                getPages();
            });
        }
    };
});

})();