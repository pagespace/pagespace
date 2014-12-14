(function() {

    /**
     *
     * @type {*}
     */
    var adminApp = angular.module('adminApp');
    adminApp.controller("MacrosController", function($scope, $rootScope, $routeParams, $location, templateService) {
        $rootScope.pageTitle = "Macros";
    });

})();