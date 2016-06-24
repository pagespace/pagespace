(function() {

    /**
     *
     * @type {*}
     */
    var adminApp = angular.module('adminApp');
    adminApp.controller('PageListMacroController', function($scope, $rootScope, $timeout, $location, siteService, pageService,
                                                        $routeParams, macroService, $log, $window) {

        $rootScope.pageTitle = 'Pages';

        var macroId = $routeParams.macroId;
        
        $scope.pages = [];

        pageService.getPages({
            macro: macroId
        }).then(function(pages) {
            $scope.pages = pages;
        }).catch(function(err) {
            $scope.showError('Error getting pages', err);
        });

        $scope.edit = function(page) {
            $location.url(`/pages/macros/${macroId}/edit?pageId=${page._id}`);
        };

        $scope.publish = function(page) {
            $location.path(`/publishing/${page._id}`);
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
    });

})();