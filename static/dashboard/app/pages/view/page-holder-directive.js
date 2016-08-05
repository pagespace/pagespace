(function() {
    
    var adminApp = angular.module('adminApp');
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
            }
        };
    });

})();