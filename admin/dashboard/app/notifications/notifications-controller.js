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
        var message = text;
        if(err.message) {
            message += ': ' + err.message;
        }
        if(err.status) {
            message += ' (' + err.status + ')';
        }
        showMessage(message, 'danger');
    };

    $rootScope.clearNotification = function() {
        $scope.message = null;
    };
    $scope.clear = function() {
        $scope.message = null;
    };
});

})();