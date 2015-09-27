(function() {

/**
 *
 * @type {*}
 */
var adminApp = angular.module('adminApp');
adminApp.controller('PluginListController', function($scope, $rootScope, $routeParams, $location, pluginService) {

    $scope.plugins = [];

    pluginService.getPlugins().success(function(plugins) {
        $scope.plugins = plugins;
    }).error(function(err) {
        $scope.showError('Error getting plugins', err);
    });

});

})();