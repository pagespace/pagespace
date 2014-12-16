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

    $rootScope.showInfo = function(text) {
        console.log(text);
        showMessage(text, 'info');
    };

    $rootScope.showWarning = function(text) {
        console.warn(text);
        showMessage(text, 'warning');
    };

    $rootScope.showError = function(text, err) {
        console.error(text);
        if(err) {
            console.error(err);
        }
        showMessage(text + ": " + err, 'danger');
    };

    $scope.clear = function() {
        $scope.message = null;
    };
});

})();