(function() {
    
var adminApp = angular.module('adminApp');
adminApp.controller('ViewPageController', function($scope, $rootScope, $routeParams) {

    var env = $routeParams.viewPageEnv;
    var url = $routeParams.url;

    $scope.getPageUrl = function() {
        var showPreview = env === 'preview';
        return '/' + (url || '') + '?_preview=' + showPreview;
    };
});

})();