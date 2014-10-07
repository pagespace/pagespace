/**
 *
 * @type {*}
 */
var adminApp = angular.module('adminApp', [ 'ngResource']);
adminApp.controller("loginController", function($scope, $resource, $window) {

    $scope.submit = function() {
        var User = $resource('/_login', null);
        var res = User.save({
            username: $scope.username,
            password: $scope.password,
            remember_me: $scope.remember_me
        });
        res.$promise.then(function(res) {
            $scope.done = true
            $window.location.href = res.href;
        })
    };
});