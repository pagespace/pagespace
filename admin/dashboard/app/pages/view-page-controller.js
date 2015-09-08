(function() {

/**
 *
 * @type {*}
 */
var adminApp = angular.module('adminApp');
adminApp.controller("ViewPageController", function($scope, $rootScope, $routeParams) {

    var env = $routeParams.env;
    var url = $routeParams.url;

    $scope.getPageUrl = function() {
        var showPreview = env === 'preview';
        return '/' + (url || '') + '?_preview=' + showPreview;
    };
});

adminApp.directive('pageHolder', function() {
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

            //injection
            var adminStyles = document.createElement('link');
            adminStyles.id =
            adminStyles.setAttribute('type', 'text/css');
            adminStyles.setAttribute('rel', 'stylesheet');
            adminStyles.setAttribute('href', '/_static/inpage/inpage-edit.css');

            var adminScript = document.createElement('script');
            adminScript.src = '/_static/inpage/inpage-edit.js';

            var pageFrame = element.find('iframe')[0];

            pageFrame.addEventListener('load', function() {
                var frameHead = pageFrame.contentWindow.document.getElementsByTagName("head")[0];
                frameHead.appendChild(adminStyles);
                frameHead.appendChild(adminScript);

                adminScript.onload = function() {
                    window.setTimeout(function() {
                        //not sure how to guarantee the css is ready
                        pageFrame.contentWindow.pagespace.setupAdminMode();
                    }, 50);
                };
            });
        }
    };
});

})();