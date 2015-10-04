(function() {

    /**
     *
     * @type {*}
     */
    var adminApp = angular.module('adminApp');
    adminApp.controller('SiteSettingsController', function($scope, $rootScope, $location, $window, $q, pageService,
                                                           siteService) {
        $scope.defaultPage = {
            redirect: null
        };

        siteService.getSite().success(function(site) {
            $scope.site = site;
        });

        pageService.getPages().success(function(pages) {
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
                }).then(function(response) {
                    var pages = response.data;
                    var page = pages.length ? pages[0] : null;

                    var defaultPageData = {
                        name: 'Default page',
                        url: '/',
                        redirect: $scope.defaultPage.redirect,
                        status: 301
                    };

                    if(!page) {
                        //create new
                        return pageService.createPage(defaultPageData);
                    } else if(page && page.status === 301) {
                        //update an existing default page redirect
                        return pageService.updatePage(page._id, defaultPageData);
                    } else {
                        var msg = 'Cannot set the default page. ' +
                            page.name + ' has been explicitly set as the default page'
                        throw new Error(msg);
                    }
                    //else the page has the url / explicitly set. leave it alone
                }).catch(function(err) {
                     $scope.showError('Unable to set default page', err);
                });
            }


            promise.then(function() {
                return siteService.updateSite(site);
            }).then(function() {
                $scope.showSuccess('Site updated.');
                $location.path('/');
            }).catch(function(err) {
                $scope.showError('Error updating site', err);
            });

        };
    });

})();