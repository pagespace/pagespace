(function() {

/**
 *
 * @type {*}
 */
var adminApp = angular.module('adminApp');
adminApp.controller("SitemapController", function($scope, $rootScope, $location, pageService) {

    $rootScope.pageTitle = "Sitemap";

    var getPages = function() {
        pageService.getPages().success(function(allPages){

            var pageMap = {};
            allPages = allPages.filter(function(page) {
                return !page.gone;
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

    getPages();

    $scope.addPage = function(parentPage) {

        parentPage = parentPage || 'primary';
        pageService.createPage(null, parentPage).success(function() {
            getPages();
        }).error(function(err) {
            $rootScope.showError("Error adding new page", err);
        });
    };

    $scope.removePage = function(page) {

        var really = window.confirm('Really delete the page, ' + page.name + '?');
        if(really) {
            pageService.deletePage(page).success(function() {
                getPages();
                $rootScope.showInfo("Page: " + page.name + " removed.");
            }).error(function(err) {
                $rootScope.showError("Error deleting page", err);
            });
        }
    };
});

})();