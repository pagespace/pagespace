(function() {

/**
 *
 * @type {*}
 */
var adminApp = angular.module('adminApp');
adminApp.controller('ViewJsonController', function($scope, $rootScope, $routeParams) {

    var url = $routeParams.url;

    $scope.getPageUrl = function() {
        return '/_api/' + url;
    };
});

adminApp.directive('jsonHolder', function() {
    return {
        restrict: 'E',
        transclude: true,
        replace: true,
        template: '<div ng-transclude></div>',
        link: function link(scope, element) {

            //sizing
            function getWindowHeight() {
                return isNaN(window.innerHeight) ? window.clientHeight : window.innerHeight;
            }

            element.css('clear', 'both');
            element.css('height', (getWindowHeight() - element[0].offsetTop - 5) + 'px');

            window.addEventListener('resize', function() {
                element.css('height', (getWindowHeight() - element[0].offsetTop - 5) + 'px');
            });
        }
    };
});

})();