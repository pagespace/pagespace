(function() {

var adminApp = angular.module('adminApp');
adminApp.controller('ViewPageController', 
    function($scope, $rootScope, $routeParams, $log, $timeout, pageService, pageViewStates) {

    var env = $routeParams.viewPageEnv;
    var url = $routeParams.url;
    
    $scope.scalingOn = true;

    $scope.state = pageViewStates.NONE;

    $scope.isEditing = () => $scope.state === pageViewStates.EDITING;
    $scope.isAdding = () => $scope.state === pageViewStates.ADDING;
    
    $scope.getPageUrl = function() {
        var showPreview = env === 'preview';
        return '/' + (url || '') + '?_preview=' + showPreview;
    };
    
    $scope.pageName = '';
    pageService.getPages({
        url: '/' + url
    }).then(pages => {
        $scope.pageName = pageService.getPageHierarchyName(pages[0]);
    });
    
    //editing
    $scope.editing = {};
    $scope.$on('edit-include', (ev, pageId, pluginName, includeId, regionName) => {
        $timeout(() => {
            $scope.state = pageViewStates.EDITING;
            $scope.editing = {
                pageId,
                pluginName,
                includeId,
                regionName
            };
        }, 0);
    });

    $scope.adding = {};
    $scope.$on('add-include', (ev, pageId, regionName) => {
        $timeout(() => {
            $scope.state = pageViewStates.ADDING;
            $scope.adding = {
                pageId,
                regionName
            };    
        }, 0);
    });

    $scope.add = function() {
        $log.info('Broadcasting "include-added" event');
        $scope.$broadcast('include-added');
    };

    $scope.save = function() {
        $log.info('Broadcasting "include-saved" event');
        $scope.$broadcast('include-saved');
    };

    $scope.cancel = function () {
        $log.info('Closing include edit');
        $scope.state = pageViewStates.NONE;
        $scope.$broadcast('edit-closed');
    };
});

})();