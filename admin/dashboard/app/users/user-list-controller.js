(function() {

    /**
     *
     * @type {*}
     */
    var adminApp = angular.module('adminApp');
    adminApp.controller("UserListController", function($scope, $rootScope, $location, userService) {
        $rootScope.pageTitle = "Users";

        userService.getUsers().success(function(users) {
            $scope.users = users;
        });
    });

})();