(function() {

/**
 *
 * @type {*}
 */
var adminApp = angular.module('adminApp');
adminApp.controller("SitemapController", function($scope, $rootScope, $location, siteService, pageService) {

    $rootScope.pageTitle = "Sitemap";

    var VIEW_MODE_STORAGE_KEY = 'sitemapViewMode';
    $scope.viewMode = sessionStorage.getItem(VIEW_MODE_STORAGE_KEY) || 'view';
    $scope.setViewMode = function(mode) {
        $scope.viewMode = mode;
        sessionStorage.setItem(VIEW_MODE_STORAGE_KEY, mode);
    };

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
            }).sort(function(a, b) {
                if (a.order < b.order)
                    return -1;
                if (a.order > b.order)
                    return 1;
                return 0;
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

        var parentRoute, siblingsQuery;
        if(parentPage) {
            parentRoute = parentPage._id;
            siblingsQuery = {
                parent: parentPage._id
            }
        } else {
            parentRoute = 'root';
            siblingsQuery = {
                root: 'primary'
            }
        }
        $rootScope.showInfo('Preparing new page...');
        //get future siblings
        pageService.getPages(siblingsQuery).success(function(pages) {

            var highestOrder = pages.map(function(page) {
                return page.order || 0;
            }).reduce(function(prev, curr){
                    return Math.max(prev, curr);
            }, -1);
            highestOrder++;
            $location.path('/pages/new/' + encodeURIComponent(parentRoute) + '/' + encodeURIComponent(highestOrder));
        }).error(function(err) {
            $rootScope.showError('Unable to determine order of new page', err);
        });
    };

    $scope.removePage = function(page) {

        $location.path('/pages/delete/' + page._id);
    };

    $scope.movePage = function(page, direction) {
        var silbingQuery = {
            order: page.order + direction
        };
        if(page.parent) {
            silbingQuery.parent = parent.page;
        } else if(page.root) {
            silbingQuery.root = page.root;
        }

        pageService.getPages(silbingQuery).success(function(siblings) {
            var siblingPage = siblings[0];
            if(!siblingPage) {
                //$rootScope.showInfo('Couldn\'t re-order pages');
                return;
            }
            async.parallel([
                function(callback) {
                    pageService.updatePage(page._id, {
                        order: page.order + direction
                    }).success(function() {
                        callback(null)
                    }).error(function(err) {
                        callback(err);
                    });
                },
                function(callback) {
                    pageService.updatePage(siblingPage._id, {
                        order: siblingPage.order - direction
                    }).success(function() {
                        callback(null)
                    }).error(function(err) {
                        callback(err);
                    });
                }
            ], function(err) {
                if(err) {
                    $rootScope.showError('Problem re-ordering pages', err);
                } else {
                    getPages();
                }
            })
        });
    };

    $scope.moveBack = function(page) {
        $scope.movePage(page, -1);
    };
    $scope.moveForward = function(page) {
        $scope.movePage(page, 1);
    };
});

})();