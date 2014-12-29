(function() {

    /**
     *
     * @type {*}
     */
    var adminApp = angular.module('adminApp');
    adminApp.controller("SiteSettingsController", function($scope, $rootScope, $location, $window, pageService, siteService) {
        $rootScope.pageTitle = "Site settings";

        $scope.defaultPage = null;

        siteService.getSite().success(function(site) {
            $scope.site = site;
        });

        pageService.getPages().success(function(pages) {
            $scope.pages = pages;
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

            if($scope.defaultPage) {
                async.waterfall([
                    function(cb) {
                        pageService.getPages({
                            url: '/'
                        }).success(function(pages) {
                            var page = pages && pages.length ? pages[0] : null;
                            cb(null, page);
                        }).error(function(e) {
                            cb(e);
                        })
                    },
                    function(page) {
                        //if a page without the default url is already set...
                        var defaultPageData = {
                            name: 'Default page',
                            url: '/',
                            redirect: $scope.defaultPage,
                            status: 301
                        };
                        if(!page) {
                            defaultPageData.url = '/';
                            pageService.createPage(defaultPageData);
                        } else if(page) {
                            pageService.updatePage(page._id, defaultPageData);
                        }
                    }
                ], function(err) {
                    $rootScope.showError('Unable to set default page', err);
                });
            }

            siteService.updateSite(site).success(function() {
                $rootScope.showSuccess('Site updated.');
                $location.path('/');
            }).error(function(err) {
                $rootScope.showError('Error updating site', err);
            });

        };
    });

})();