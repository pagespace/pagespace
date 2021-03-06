(function() {
    var adminApp = angular.module('adminApp');
    adminApp.factory('userService', function($http, errorFactory) {

        function UserService() {
        }
        
        UserService.prototype.getUsers = function() {
            return $http.get('/_api/users').then(res => res.data).catch(res => {
                throw errorFactory.createResponseError(res);
            });
        };
        UserService.prototype.getUser = function(userId) {
            return $http.get('/_api/users/' + userId).then(res => res.data).catch(res => {
                throw errorFactory.createResponseError(res);
            });
        };

        UserService.prototype.createUser = function(userData) {
            return $http.post('/_api/users', userData).then(res => res.data).catch(res => {
                throw errorFactory.createResponseError(res);
            });
        };

        UserService.prototype.deleteUser = function(userId) {
            return $http.delete('/_api/users/' + userId).then(res => res.data).catch(res => {
                throw errorFactory.createResponseError(res);
            });
        };

        UserService.prototype.updateUser = function(userId, userData) {
            return $http.put('/_api/users/' + userId, userData).then(res => res.data).catch(res => {
                throw errorFactory.createResponseError(res);
            });
        };

        return new UserService();
    });

})();


