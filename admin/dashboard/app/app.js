/* globals console */
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

            //inpage
            when('/add-include/:pageId/:region', {
                templateUrl: '/_static/dashboard/app/inpage/add-include.html',
                controller: 'AddIncludeController'
            }).
            when('/remove-include/:pageId/:region/:include', {
                templateUrl: '/_static/dashboard/app/inpage/remove-include.html',
                controller: 'RemoveIncludeController'
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
            when('/pages/:section/:pageId', {
                templateUrl: '/_static/dashboard/app/pages/page.html',
                controller: 'PageController'
            }).
            when('/view-page/:viewPageEnv', {
                templateUrl: '/_static/dashboard/app/pages/view-page.html',
                controller: 'ViewPageController'
            }).
            when('/view-page/:viewPageEnv/:url*', {
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

    adminApp.controller('MainController', function($scope, $location, $log, $timeout, pageService) {
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
            if(next.params && next.params.viewPageEnv) {
                var url = '/' + (next.params.url || '');
                $scope.viewPageUrl = url;

                $scope.viewPageUrlPublished = false;
                pageService.getPages({
                    url:  url
                }).success(function(pages) {
                    if(pages.length  === 1) {
                        $scope.viewPageName = pages[0].name;
                        $scope.viewPageUrlPublished = pages[0].published;
                    }
                });
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

        function swapIncludes(pageId, regionName, includeOne, includeTwo) {
            pageService.getPage(pageId).success(function(page) {
                page = pageService.swapIncludes(page, regionName, parseInt(includeOne), parseInt(includeTwo));
                page = pageService.depopulatePage(page);
                pageService.updatePage(pageId, page).success(function() {
                    $log.info('Includes (%s and %s) swapped for pageId=%s, region=%s',
                        includeOne, includeTwo, pageId, regionName);
                    window.location.reload();
                }).error(function(err) {
                    $scope.err = err;
                    $log.error(err, 'Failed to swap includes (%s and %s) swapped for pageId=%s, region=%s',
                        includeOne, includeTwo, pageId, regionName);
                });
            }).error(function(err) {
                $scope.err = err;
                $log.error(err, 'Unable to get page: %s', pageId);
            });
        }

        window.addEventListener('message', function(ev) {
            if(ev.origin === window.location.origin) {
                if(ev.data.name === 'drag-include-start') {
                    document.body.classList.add('dragging-include');
                } else if(ev.data.name === 'drag-include-end') {
                    document.body.classList.remove('dragging-include');
                } else if(ev.data.name === 'swap-includes') {
                    swapIncludes(ev.data.pageId, ev.data.regionName, ev.data.includeOne, ev.data.includeTwo);
                }
            }
        });
    });
})();
