(function() {

    /**
     *
     * @type {*}
     */
    var adminApp = angular.module('adminApp');
    adminApp.controller("UserController", function($scope, $rootScope, $location, $routeParams, $window, userService) {
        $rootScope.pageTitle = "User";

        var userId = $routeParams.userId;
        $scope.userId = userId;

        $scope.roles = [{
            name: "admin",
            label: "Admin"
        }];

        if(userId) {
            userService.getUser(userId).success(function(user) {
                $scope.user = user;
            });
        }

        $scope.cancel = function() {
            $location.path('/users');
        };

        $scope.save = function(form) {
            if(form.$invalid) {
                $window.scrollTo(0,0);
                $scope.submitted = true;
                return;
            }
            var user = $scope.user;
            if(userId) {
                userService.updateUser(userId, user).success(function() {
                    $rootScope.showSuccess('User updated.');
                    $location.path('/users');
                }).error(function(err) {
                    $rootScope.showError('Error updating user', err);
                });
            } else {
                userService.createUser(user).success(function() {
                    $rootScope.showSuccess('User created.');
                    $location.path('/users');
                }).error(function(err) {
                    $rootScope.showError('Error creating user', err);
                });
            }
        };

        $scope.remove = function() {
            userService.deleteTemplate($scope.user._id).success(function (res) {
                console.log('User removed');
                $location.path('/templates');
            }).error(function(err) {
                $rootScope.showError('Error deleting template', err);
            });
        };
    });

})();