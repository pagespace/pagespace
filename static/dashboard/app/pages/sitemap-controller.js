(function() {

/**
 *
 * @type {*}
 */
var adminApp = angular.module('adminApp');
adminApp.controller('SitemapController', function($scope, $rootScope, $timeout, $location, siteService, pageService,
                                                  $routeParams, macroService) {

    $rootScope.pageTitle = 'Sitemap';

    $scope.updateSearch = function(action) {
        $scope.viewMode = action;
        $location.path('/pages').search('action', action).replace();
    };

    $scope.macroAction = $routeParams.macroAction;
    $scope.viewMode = $location.search().action;
    if(!$scope.viewMode && !$scope.macroAction) {
        $scope.updateSearch('configure');
    }

    function getSite() {
        siteService.getSite().then(function(site) {
            $scope.site = site;
        }).catch(function(err) {
            $scope.showError('Error getting site', err);
        });
    }

    function getPages() {
        pageService.getPages().then(function(allPages) {
            var pageMap = {};
            allPages = allPages.filter(function(page) {
                return page.status < 400;
            }).sort(function(a, b) {
                if (a.order < b.order) {
                    return -1;
                } else if (a.order > b.order) {
                    return 1;
                } else {
                    return 0;
                }
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
                return page.root === 'top';
            });
            populateChildren(primaryRoots);

            $scope.pages = primaryRoots;
        }).catch(function(err) {
            $scope.showError('Error getting pages', err);
        });
    }
    
    function getMacros() {
        macroService.getMacros().then(function(macros) {
            $scope.macros = macros;
        });
    }

    getSite();
    getPages();
    getMacros();

    $scope.addPage = function(parentPage) {

        var parentRoute, siblingsQuery;
        if(parentPage) {
            parentRoute = parentPage._id;
            siblingsQuery = {
                parent: parentPage._id
            };
        } else {
            parentRoute = 'root';
            siblingsQuery = {
                root: 'top'
            };
        }
        $scope.showInfo('Preparing new page...');
        //get future siblings
        pageService.getPages(siblingsQuery).then(function(pages) {

            var highestOrder = pages.map(function(page) {
                return page.order || 0;
            }).reduce(function(prev, curr){
                    return Math.max(prev, curr);
            }, -1);
            highestOrder++;
            $location.path('/pages/new/' + encodeURIComponent(parentRoute) + '/' + encodeURIComponent(highestOrder));
        }).catch(function(msg) {
            $scope.showError('Unable to determine order of new page', msg);
        });
    };

    $scope.removePage = function(page) {

        if(page.published) {
            $location.path('/pages/delete/' + page._id);
        } else {
            var really = window.confirm('Really delete this page?');
            if(really) {
                pageService.deletePage(page).then(function() {
                    window.location.reload();
                    $scope.showInfo('Page: ' + page.name + ' removed.');
                }).catch(function(msg) {
                    $scope.showError('Error deleting page', msg);
                });
            }
        }

    };

    $scope.movePage = function(page, direction) {

        var silbingQuery = {
            order: page.order + direction
        };
        if(page.parent) {
            silbingQuery.parent = page.parent._id;
        } else if(page.root) {
            silbingQuery.root = page.root;
        }

        pageService.getPages(silbingQuery).then(function(siblings) {

            var siblingPage = siblings[0];
            if(!siblingPage) {
                //$scope.showInfo('Couldn\'t re-order pages');
                return;
            }
            var promises = [];
            promises.push(pageService.updatePage(page._id, {
                order: page.order + direction,
                draft: true
            }));
            promises.push(pageService.updatePage(siblingPage._id, {
                order: siblingPage.order - direction,
                draft: true
            }));

            Promise.all(promises).then(function() {
               getPages();
            }).catch(function(err) {
                $scope.showError('Problem re-ordering pages', err);
            });
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