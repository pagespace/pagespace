(function() {
    
    var adminApp = angular.module('adminApp');
    adminApp.directive('pageHolder', function($timeout) {
        return {
            restrict: 'E',
            transclude: true,
            replace: true,
            template: '<div ng-transclude></div>',
            link: function link(scope, element) {

                var pageFrame = element.find('iframe')[0];
                pageFrame.addEventListener('load', function() {

                    //injection
                    var adminStyles = document.createElement('link');
                    adminStyles.setAttribute('type', 'text/css');
                    adminStyles.setAttribute('rel', 'stylesheet');
                    adminStyles.setAttribute('href', '/_static/inpage/inpage-edit.css');

                    var pluginInterfaceScript = document.createElement('script');
                    pluginInterfaceScript.src = '/_static/inpage/plugin-interface.js';

                    var adminScript = document.createElement('script');
                    adminScript.src = '/_static/inpage/inpage-edit.js';

                    adminScript.onload = function() {
                        window.setTimeout(function() {
                            //not sure how to guarantee the css is ready
                            pageFrame.contentWindow.pagespace.setupAdminMode();
                        }, 50);
                    };

                    var frameHead = pageFrame.contentWindow.document.getElementsByTagName('head')[0];
                    frameHead.appendChild(adminStyles);
                    frameHead.appendChild(pluginInterfaceScript);
                    frameHead.appendChild(adminScript);
                });
                
                scope.$on('include-saved', function() {
                    $timeout(() => {
                        pageFrame.contentWindow.location.reload();
                    }, 300);
                });

                scope.$on('include-added', function() {
                    $timeout(() => {
                        pageFrame.contentWindow.location.reload();
                    }, 300);
                });

                scope.$on('include-removed', () => {
                    pageFrame.contentWindow.location.reload();
                });
            }
        };
    });

})();