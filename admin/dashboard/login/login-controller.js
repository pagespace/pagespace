(function() {

    /**
     *
     * @type {*}
     */
    var adminApp = angular.module('adminApp', [ 'ngResource']);
    adminApp.controller("loginController", function($scope, $resource, $window) {

        $scope.submit = function() {
            var Login = $resource('/_login', null);
            var res = Login.save({
                username: $scope.username,
                password: $scope.password,
                remember_me: $scope.remember_me
            });
            res.$promise.then(function(res) {
                $scope.done = true
                if(res.href) {
                    $window.location.href = res.href;
                }
            }).catch(function(res) {
                if(res.data && res.data.badCredentials) {
                    $scope.badCredentials = true;
                }
            });
        };
    });

})();
