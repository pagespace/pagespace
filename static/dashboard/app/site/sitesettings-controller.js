(function() {

    /**
     *
     * @type {*}
     */
    var adminApp = angular.module('adminApp');
    adminApp.controller('SiteSettingsController', function($scope, $rootScope, $location, $window, $q, pageService,
                                                           siteService) {

        $scope.getPageHierarchyName = pageService.getPageHierarchyName;

        $scope.defaultPage = {
            redirect: ''
        };

        siteService.getSite().then(function(site) {
            $scope.site = site;
        });

        pageService.getPages().then(function(pages) {
            $scope.availablePages = pages.filter(function(page) {
                return page.status === 200 && page.parent !== null;
            });
            $scope.defaultPage = pages.filter(function(page) {
                return page.url === '/';
            })[0];
        });

        $scope.cancel = function() {
            $location.path('/');
        };

        $scope.save = function(form) {

            if(form.$invalid) {
                $window.scrollTo(0,0);
                $scope.submitted = true;
                return;
            }
            var site = $scope.site;

            var promise = $q.when();
            if($scope.defaultPage) {
                //get existing default pages (where url == /)
                promise = promise.then(function() {
                    return pageService.getPages({
                        url: '/'
                    });
                }).then(function(pages) {
                    var currentDefaultPage = pages && pages.length ? pages[0] : null;

                    var defaultPageData = {
                        name: 'Default page',
                        url: '/',
                        redirect: $scope.defaultPage.redirect,
                        status: 301
                    };

                    if(!currentDefaultPage && defaultPageData.redirect) {
                        //brand new default page
                        return pageService.createPage(defaultPageData);
                    } else if(currentDefaultPage && currentDefaultPage.status !== 200 && defaultPageData.redirect) {
                        //update an existing default page redirect
                        return pageService.updatePage(currentDefaultPage._id, defaultPageData);
                    } else if(currentDefaultPage && currentDefaultPage.status !== 200 && !defaultPageData.redirect) {
                        //delete the current default page if its a redirect
                        currentDefaultPage.status = 404;
                        currentDefaultPage.redirect = null;
                        return pageService.deletePage(currentDefaultPage);
                    } else {
                        //another page is using '/' as its url. Don't break it
                        const message =
                            `${currentDefaultPage.name}, is already the effective default page`;
                        throw new Error(message);
                    }
                    //else the page has the url / explicitly set. leave it alone
                });
            }

            promise.then(function() {
                return siteService.updateSite(site._id, site);
            }).then(function() {
                $location.path('/');
            }).catch(function(err) {
                $scope.showError('Error updating site', err);
            });
        };
    });

})();