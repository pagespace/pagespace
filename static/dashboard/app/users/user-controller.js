(function() {

    /**
     *
     * @type {*}
     */
    var adminApp = angular.module('adminApp');
    adminApp.controller('UserController', function($scope, $rootScope, $log, $location, $routeParams, $window,
                                                   userService) {
        $rootScope.pageTitle = 'User';

        var userId = $routeParams.userId;
        $scope.userId = userId;

        $scope.roles = [{
            name: 'editor',
            label: 'Editor'
        },{
            name: 'developer',
            label: 'Developer'
        },{
            name: 'admin',
            label: 'Admin'
        }];

        if(userId) {
            userService.getUser(userId).then(function(user) {
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
                userService.updateUser(userId, user).then(function() {
                    $scope.showSuccess('User updated.');
                    $location.path('/users');
                }).catch(function(err) {
                    $scope.showError('Error updating user', err);
                });
            } else {
                userService.createUser(user).then(function() {
                    $scope.showSuccess('User created.');
                    $location.path('/users');
                }).catch(function(err) {
                    $scope.showError('Error creating user', err);
                });
            }
        };

        $scope.remove = function() {
            userService.deleteTemplate($scope.user._id).then(function () {
                $log.info('User removed');
                $location.path('/templates');
            }).catch(function(err) {
                $scope.showError('Error deleting template', err);
            });
        };
    });

})();