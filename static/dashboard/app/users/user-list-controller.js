(function() {

    /**
     *
     * @type {*}
     */
    var adminApp = angular.module('adminApp');
    adminApp.controller('UserListController', function($scope, $rootScope, $location, userService) {
        $rootScope.pageTitle = 'Users';

        userService.getUsers().then(function(users) {
            $scope.users = users;
        });
    });

})();