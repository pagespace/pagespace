(function() {

    /**
     *
     * @type {*}
     */
    var adminApp = angular.module('adminApp');
    adminApp.controller('PageMacroNewController', function($scope, $rootScope, $timeout, $location, siteService, 
                                                           pageService, $routeParams, macroService, $log, $window) {

        $rootScope.pageTitle = 'Page Macros';
        
        var macroId = $routeParams.macroId;
        $scope.page = {};

        macroService.getMacro(macroId).then(function(macro) {
            $scope.macro = macro;
            //$scope.page.root = 'top';
            $scope.page.parent = macro.parent;
            $scope.page.basePage = macro.basePage;
            $scope.page.template = macro.template;
            $scope.page.useInNav = !!macro.useInNav;
            $scope.page.macro = macro._id;
        });

        pageService.getAvailableTags().then(tags => {
            $scope.availableTags  = tags;
        });

        $scope.updateUrl = function() {
            $scope.page.url = pageService.generateUrl($scope.page);
        };

        $scope.getMatchingTags = function(text) {
            text = text.toLowerCase();
            const tags = $scope.availableTags.filter(tag => tag.text && tag.text.toLowerCase().indexOf(text) > -1);
            return Promise.resolve(tags);
        };

        $scope.cancel = function() {
            $location.path('/pages');
        };

        $scope.$watch('page.name', function() {
            if($scope.pageForm && $scope.pageForm.url && $scope.pageForm.url.$pristine) {
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
            var macro = $scope.macro;

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

            //add a new page
            pageService.getOrderOfLastPage(page.parent).then(function(highestOrder) {
                page.order = ++highestOrder;
                page = pageService.depopulatePage(page);
                return pageService.createPage(page);
            }).then(function(createdPage) {
                $log.info('Page successfully created');
                page = createdPage;
                //for each macro include create
                var includeCreationPromises = macro.includes.map(function(includeMeta) {
                    return pageService.createIncludeData(includeMeta.plugin);
                });
                return Promise.all(includeCreationPromises);
            }).then(function(includesData) {
                //add the newly created includes to the new page
                includesData.forEach(function (includeData, i) {
                    var regionIndex = pageService.getRegionIndex(page, macro.includes[i].region);
                    pageService.addIncludeToPage(page, regionIndex, macro.includes[i].plugin, includeData);
                });
                //save
                page = pageService.depopulatePage(page);
                pageService.updatePage(page._id, page);
                $location.url(`/pages/macros/${macroId}/edit?pageId=${page._id}&created=true`);
            }).catch(function(err) {
                $log.error(err, 'Error creating page');
                $scope.showError('Error adding new page', err);
            });
        };
    });

})();