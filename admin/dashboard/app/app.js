(function() {
    var adminApp = angular.module('adminApp', [
        'ngRoute',
        'ngResource',
        'ngTagsInput',
        'focus-if',
        'ui.codemirror'
    ]);

    adminApp.config(['$routeProvider', function($routeProvider) {
        $routeProvider.

            //site
            when('/pages/site', {
                templateUrl: '/_static/dashboard/app/site/sitesettings.html',
                controller: 'SiteSettingsController'
            }).

            //pages
            when('/pages/new/root/:order', {
                templateUrl: '/_static/dashboard/app/pages/page.html',
                controller: 'PageController'
            }).
            when('/pages/new/:parentPageId/:order', {
                templateUrl: '/_static/dashboard/app/pages/page.html',
                controller: 'PageController'
            }).
            when('/pages/:pageId', {
                templateUrl: '/_static/dashboard/app/pages/page.html',
                controller: 'PageController'
            }).
            when('/pages/delete/:pageId', {
                templateUrl: '/_static/dashboard/app/pages/delete-page.html',
                controller: 'DeletePageController'
            }).
            when('/pages/:section/:pageId/', {
                templateUrl: '/_static/dashboard/app/pages/page.html',
                controller: 'PageController'
            }).
            when('/view-page/:env/', {
                templateUrl: '/_static/dashboard/app/pages/view-page.html',
                controller: 'ViewPageController'
            }).
            when('/view-page/:env/:url*', {
                templateUrl: '/_static/dashboard/app/pages/view-page.html',
                controller: 'ViewPageController'
            }).

            //plugins
            when('/plugins', {
                templateUrl: '/_static/dashboard/app/plugins/plugin-list.html',
                controller: 'PluginListController'
            }).
            when('/plugins/new', {
                templateUrl: '/_static/dashboard/app/plugins/plugin.html',
                controller: 'PluginController'
            }).
            when('/plugins/:pluginId', {
                templateUrl: '/_static/dashboard/app/plugins/plugin.html',
                controller: 'PluginController'
            }).

            //publishing
            when('/publishing', {
                templateUrl: '/_static/dashboard/app/publishing/publishing.html',
                controller: 'PublishingController'
            }).
            when('/publishing/:pageId', {
                templateUrl: '/_static/dashboard/app/publishing/publishing.html',
                controller: 'PublishingController'
            }).

            //media
            when('/media', {
                templateUrl: '/_static/dashboard/app/media/media.html',
                controller: 'MediaController'
            }).
            when('/media/upload', {
                templateUrl: '/_static/dashboard/app/media/media-upload.html',
                controller: 'MediaUploadController'
            }).
            when('/media/:mediaId', {
                templateUrl: '/_static/dashboard/app/media/media-item.html',
                controller: 'MediaItemController'
            }).

            //macros
            when('/macros', {
                templateUrl: '/_static/dashboard/app/macros/macros.html',
                controller: 'MacrosController'
            }).

            //templates
            when('/templates', {
                templateUrl: '/_static/dashboard/app/templates/template-list.html',
                controller: 'TemplateListController'
            }).
            when('/templates/new', {
                templateUrl: '/_static/dashboard/app/templates/template.html',
                controller: 'TemplateController'
            }).
            when('/templates/:templateId', {
                templateUrl: '/_static/dashboard/app/templates/template.html',
                controller: 'TemplateController'
            }).

            //users
            when('/users', {
                templateUrl: '/_static/dashboard/app/users/user-list.html',
                controller: 'UserListController'
            }).
            when('/users/new', {
                templateUrl: '/_static/dashboard/app/users/user.html',
                controller: 'UserController'
            }).
            when('/users/:userId', {
                templateUrl: '/_static/dashboard/app/users/user.html',
                controller: 'UserController'
            }).

            when('/pages', {
                templateUrl: '/_static/dashboard/app/pages/site-map.html',
                controller: 'SitemapController'
            }).

            //default to sitemap
            otherwise({
                templateUrl: '/_static/dashboard/app/pages/site-map.html',
                controller: 'SitemapController'
            });
    }]);

    if(window.bunyan) {
        adminApp.config(function($provide) {
            $provide.decorator('$log', function($delegate) {
                $delegate = bunyan.createLogger({
                    name: 'pagespace',
                    streams: [
                        {
                            level: localStorage.getItem('pagespace:logLevel') || 'info',
                            stream: new bunyan.ConsoleFormattedStream(),
                            type: 'raw'
                        }
                    ]
                });

                return $delegate;
            });
        });
    }

    adminApp.controller('MainController', function($scope, $location, $timeout) {
        $scope.menuClass = function(page) {

            //default page
            var path = $location.path();
            if(path === '/') {
                path = '/pages';
            }
            var match = path.indexOf(page) === 0;
            return match ? 'active' : '';
        };

        $scope.$on('$routeChangeStart', function(ev, next) {
            if(next.params && next.params.url) {
                $scope.viewPageUrl = '/' + (next.params.url || '');
            } else {
                $scope.viewPageUrl = null;
            }
        });

        //notifications
        $scope.message = null;

        function showMessage(text, type) {
            $scope.message = {
                type: type,
                text: text
            };
        }

        $scope.showSuccess = function(text) {
            console.log(text);
            showMessage(text, 'success');
        };

        $scope.showInfo = function(text) {
            console.log(text);
            showMessage(text, 'info');
        };

        $scope.showWarning = function(text) {
            console.warn(text);
            showMessage(text, 'warning');
        };

        $scope.showError = function(text, err) {
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

        $scope.clearNotification = function() {
            $scope.message = null;
        };
        $scope.clear = function() {
            $scope.message = null;
        };

        var hideTimeout = null;
        $scope.$watch('message', function() {
            $timeout.cancel(hideTimeout);
            hideTimeout = $timeout(function() {
                $scope.message = null;
            }, 1000 * 10);
        });
    });

})();
