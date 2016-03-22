(function() {

    /**
     *
     * @type {*}
     */
    var adminApp = angular.module('adminApp');
    adminApp.controller('MacrosController', function($scope, $rootScope) {
        $rootScope.pageTitle = 'Macros';
    });

})();