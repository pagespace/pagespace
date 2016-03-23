(function() {
    var adminApp = angular.module('adminApp');
    adminApp.factory('userService', function($http) {

        function UserService() {

        }
        UserService.prototype.getUsers = function() {
            return $http.get('/_api/users');
        };
        UserService.prototype.getUser = function(userId) {
            return $http.get('/_api/users/' + userId);
        };

        UserService.prototype.createUser = function(userData) {
            return $http.post('/_api/users', userData);
        };

        UserService.prototype.deleteUser = function(userId) {
            return $http.delete('/_api/users/' + userId);
        };

        UserService.prototype.updateUser = function(userId, userData) {
            return $http.put('/_api/users/' + userId, userData);
        };

        return new UserService();
    });

})();


