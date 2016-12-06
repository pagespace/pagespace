(function() {
    
const states = {
    NONE: Symbol('NONE'),
    EDITING: Symbol('EDITING'),
    ADDING: Symbol('ADDING')
};
    
var adminApp = angular.module('adminApp');
adminApp.controller('ViewPageController', function($scope, $rootScope, $routeParams, $log, $timeout, pageService) {

    var env = $routeParams.viewPageEnv;
    var url = $routeParams.url;

    $scope.state = states.NONE;

    $scope.isEditing = () => $scope.state === states.EDITING;
    $scope.isAdding = () => $scope.state === states.ADDING;
    
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
            $scope.state = states.EDITING;
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
            $scope.state = states.ADDING;
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
        $scope.state = states.NONE;
        $scope.$broadcast('edit-closed');
    };
});

})();