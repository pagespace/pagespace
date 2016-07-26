(function() {

    var authApp = angular.module('authApp', [ 'ngRoute']);

    authApp.config(['$routeProvider', function($routeProvider) {
        $routeProvider.
            when('/forgot-password', {
                templateUrl: '/_static/dashboard/auth/forgot-password.html',
                controller: 'ForgotPasswordController'
            }).
            when('/reset-password', {
                templateUrl: '/_static/dashboard/auth/reset-password.html',
                controller: 'ResetPasswordController'
            }).
            otherwise({
                templateUrl: '/_static/dashboard/auth/login.html',
                controller: 'LoginController'
            });
    }]);

    /**
     *
     * @type {*}
     */
    authApp.controller("LoginController", function($scope, $http, $timeout, $window, $location) {

        $scope.forgot = function() {
            $location.path('/forgot-password');
        };

        $scope.submit = function() {
            $scope.invalidClass = '';
            $http.post('/_auth/login', {
                username: $scope.username,
                password: $scope.password,
                remember_me: $scope.remember_me
            }).then(function(res) {
                $scope.done = true;
                $window.location.href = res.data.href;
            }).catch(function(res) {
                if(res.data && res.data.badCredentials) {
                    $scope.badCredentials = true;
                    $scope.invalidClass = 'login-invalid';
                    $timeout(function() {
                        $scope.invalidClass = false;
                    }, 600)
                }
            });
        };
    });

    authApp.controller("ForgotPasswordController", function($scope, $http, $log, $location) {

        $scope.done = false;

        $scope.toLogin = function() {
            $location.path('/');
        };
        $scope.submit = function() {
            $http.post('/_auth/forgot-password', {
                username: this.username
            }).then(function() {
                $scope.done = true;
            }).catch(function(res) {
                $log.error(res.data.message);
            });
        };
    });


    authApp.controller("ResetPasswordController", function($scope, $http, $log, $location) {
        
        var token = $location.search().token;

        if(!token) {
            $location.path('/');
        }
        
        $scope.toLogin = function() {
            $location.path('/');
        };
        $scope.submit = function() {
            $http.post('/_auth/reset-password', {
                token: token,
                username : this.username,
                password: this.password
            }).then(function() {
                $scope.done = true;
                $scope.error = false;
            }).catch(function(res) {
                $scope.error = true;
                $log.error(res.data.message);
            });
        };
    });
})();
