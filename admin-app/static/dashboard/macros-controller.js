(function() {

    /**
     *
     * @type {*}
     */
    var adminApp = angular.module('adminApp');
    adminApp.controller("macrosController", function($scope, $rootScope, $routeParams, $location, templateService) {
        $rootScope.pageTitle = "Macros";
    });

})();