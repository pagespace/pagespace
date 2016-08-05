(function() {

/**
 *
 * @type {*}
 */
var adminApp = angular.module('adminApp');
adminApp.controller('MacroListController', function($scope, $rootScope, $routeParams, $location, macroService) {

    $rootScope.pageTitle = 'Macros';

    $scope.macros = [];

    macroService.getMacros().then(function(macros) {
        $scope.macros = macros;
    }).catch(function(err) {
        $scope.showError('Error getting macros', err);
    });

});

})();