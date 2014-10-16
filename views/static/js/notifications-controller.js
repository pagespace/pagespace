(function() {

/**
 *
 * @type {*}
 */
var adminApp = angular.module('adminApp');
adminApp.controller("notificationsController", function($scope, $rootScope) {
    $scope.message = null;

    function showMessage(text, type) {
        $scope.message = {
            type: type,
            text: text
        };
    }

    $rootScope.showSuccess = function(text) {
        console.log(text);
        showMessage(text, 'success');
    };

    $rootScope.showWarning = function(text) {
        console.warn(text);
        showMessage(text, 'warning');
    };

    $rootScope.showError = function(text) {
        console.error(text);
        showMessage(text, 'danger');
    };

    $scope.clear = function() {
        $scope.message = null;
    };
});

})();