(function() {

    /**
     *
     * @type {*}
     */
    var adminApp = angular.module('adminApp');
    adminApp.controller('PageMacroEditController', function($scope, $rootScope, $timeout, $location, siteService, pageService,
                                                      $routeParams, macroService, $log, $window) {

        $rootScope.pageTitle = 'Page Macros';
        
        var macroId = $routeParams.macroId;
        var pageId = $location.search().pageId;

        $scope.page = {};

        if(pageId) {
            $log.debug('Fetching page data for: %s', pageId);
            $scope.pageId = pageId;
            pageService.getPage(pageId).then(function(page) {
                $log.debug('Got page data OK.');
                $log.trace('...with data:\n', JSON.stringify(page, null, '\t'));
                $scope.page = page;

                if(page.expiresAt) {
                    page.expiresAt = new Date(page.expiresAt);
                }
                if(page.publishedAt) {
                    page.publishedAt = new Date(page.publishedAt);
                }

                //depopulate redirect page
                if(page.redirect) {
                    page.redirect = page.redirect._id;
                }
            });
        } else {
            macroService.getMacro(macroId).then(function(macro) {
                $scope.macro = macro;
                //$scope.page.root = 'top';
                $scope.page.parent = macro.parent;
                $scope.page.basePage = macro.basePage;
                $scope.page.template = macro.template;
                $scope.page.useInNav = !!macro.useInNav;
                $scope.page.macro = macro._id;
            });
        }

        $scope.updateUrl = function() {
            $scope.page.url = pageService.generateUrl($scope.page);
        };

        $scope.cancel = function() {
            $location.path('/pages');
        };

        $scope.$watch('page.name', function() {
            if(!pageId && $scope.pageForm && $scope.pageForm.url && $scope.pageForm.url.$pristine) {
                $scope.updateUrl();
            }
        });

        $scope.save = function(form) {
            if(form.$invalid) {
                $scope.submitted = true;
                $window.scrollTo(0,0);
                return;
            }

            var page = $scope.page;

            if(pageId) {
                $log.info('Update page: %s...', pageId);
                $log.trace('...with data:\n%s', JSON.stringify(page, null, '\t'));
                page = pageService.depopulatePage(page);
                pageService.updatePage(pageId, page).then(function() {
                    $log.info('Page successfully updated');
                    $scope.showSuccess('Page: ' + page.name + ' saved.');
                    $location.path(`/pages/macros/${macroId}/list`);
                }).catch(function(err) {
                    $log.error(err, 'Error updating page');
                    $scope.showError('Error updating page', err);
                });
            } else {
                $log.info('Creating page...');
                $log.trace('...with data:\n%s', JSON.stringify(page, null, '\t'));

                //create regions based on template
                var pageRegions = [];
                page.template.regions.forEach(function(regionMeta) {
                    var newRegion = {};
                    newRegion.name = regionMeta.name;
                    newRegion.includes = [];
                    pageRegions.push(newRegion);
                });
                page.regions = pageRegions;

                if(page.basePage) {
                    pageService.synchronizeWithBasePage(page);
                }

                page = pageService.depopulatePage(page);
                pageService.createPage(page).then(function(page) {
                    $log.info('Page successfully created');
                    $scope.showSuccess('Page: ' + page.name + ' created.');
                    $location.path(`/pages/macros/${macroId}/list`);
                }).catch(function(err) {
                    $log.error(err, 'Error creating page');
                    $scope.showError('Error adding new page', err);
                });
            }
        };
    });

})();