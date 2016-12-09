(function() {
    
    var adminApp = angular.module('adminApp');
    adminApp.directive('pageHolder', function($timeout, pageViewStates) {
        return {
            restrict: 'E',
            transclude: true,
            replace: true,
            template: '<div ng-transclude></div>',
            link: function link(scope, el) {

                var pageFrame = el.find('iframe')[0];
                pageFrame.addEventListener('load', function() {

                    //scaling
                    scope.$watch('state', (newVal, oldVal, scope) => {
                        scalePageView(scope.state, scope.scalingOn);
                    });
                    scope.$watch('scalingOn', (newVal, oldVal, scope) => {
                        scalePageView(scope.state, scope.scalingOn);
                    });

                    function scalePageView(pageViewState, scalingOn) {
                        let scale = 1;
                        if(pageViewState !== pageViewStates.NONE && scalingOn) {
                            const ww = window.innerWidth;
                            if(ww > 800 && ww <= 1500) {
                                scale = 0.5;
                            } else if (ww > 1500) {
                                scale = (ww - 800) / ww;
                            }
                        }
                        el[0].style.transform = `scale(${scale})`;
                        var scaleCompensation = ((1 / scale) * 100) + '%';
                        pageFrame.style.width = scaleCompensation;
                        pageFrame.style.height = scaleCompensation;
                    }

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