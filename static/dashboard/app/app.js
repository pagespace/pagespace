/* globals console */
(function() {
    var adminApp = angular.module('adminApp', [
        'ngRoute',
        'ngTagsInput',
        'focus-if',
        'ui.codemirror'
    ]);

    adminApp.constant('pageViewStates', {
        NONE: Symbol('NONE'),
        EDITING: Symbol('EDITING'),
        ADDING: Symbol('ADDING')
    });

    adminApp.config(['$routeProvider', '$provide', '$httpProvider', function($routeProvider, $provide, $httpProvider) {
        $routeProvider.

            //site
            when('/pages/site', {
                templateUrl: '/_static/dashboard/app/site/sitesettings.html',
                controller: 'SiteSettingsController'
            }).

            //sitemap
            when('/pages', {
                templateUrl: '/_static/dashboard/app/pages/site-map.html',
                controller: 'SitemapController',
                reloadOnSearch: false
            }).
            //page macros
            when('/pages/macros/:macroId/:macroAction', {
                templateUrl: '/_static/dashboard/app/pages/site-map.html',
                controller: 'SitemapController'
            }).
            
            //pages
            when('/pages/new/root/:order', {
                templateUrl: '/_static/dashboard/app/pages/page/page.html',
                controller: 'PageController'
            }).
            when('/pages/new/:parentPageId/:order', {
                templateUrl: '/_static/dashboard/app/pages/page/page.html',
                controller: 'PageController'
            }).
            when('/pages/:pageId', {
                templateUrl: '/_static/dashboard/app/pages/page/page.html',
                controller: 'PageController'
            }).
            when('/pages/delete/:pageId', {
                templateUrl: '/_static/dashboard/app/pages/page/delete-page.html',
                controller: 'DeletePageController'
            }).
            when('/pages/configure/:section/:pageId', {
                templateUrl: '/_static/dashboard/app/pages/page/page.html',
                controller: 'PageController'
            }).

            //view page
            when('/view-page/:viewPageEnv', {
                templateUrl: '/_static/dashboard/app/pages/view/view-page.html',
                controller: 'ViewPageController'
            }).
            when('/view-page/:viewPageEnv/:url*', {
                templateUrl: '/_static/dashboard/app/pages/view/view-page.html',
                controller: 'ViewPageController'
            }).

            //view json
            when('/view-json/:url*', {
                templateUrl: '/_static/dashboard/app/pages/view/view-json.html',
                controller: 'ViewJsonController'
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
            when('/publishing/compare/:pageId*', {
                templateUrl: '/_static/dashboard/app/publishing/compare.html',
                controller: 'CompareController'
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
                templateUrl: '/_static/dashboard/app/macros/macro-list.html',
                controller: 'MacroListController'
            }).
            when('/macros/new', {
                templateUrl: '/_static/dashboard/app/macros/macro.html',
                controller: 'MacroController'
            }).
            when('/macros/:macroId', {
                templateUrl: '/_static/dashboard/app/macros/macro.html',
                controller: 'MacroController'
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

            //default to sitemap
            otherwise({
                templateUrl: '/_static/dashboard/app/pages/site-map.html',
                controller: 'SitemapController'
            });
        
        $httpProvider.interceptors.push(function($q, $window, $timeout) {
            return {
                // optional method
                'responseError': function(response) {
                    var status = response.status;
                    if (status === 401) {
                        $timeout(() => {
                            $window.location.href = '/_auth/login';    
                        }, 1000);
                    }
                    return $q.reject(response);
                }
            };
        });
    }]);

    if(window.bunyan) {
        adminApp.config(function($provide) {
            $provide.decorator('$log', function($delegate) {
                $delegate = bunyan.createLogger({
                    name: 'pagespace',
                    streams: [
                        {
                            level: localStorage.getItem('loglevel') || 'info',
                            stream: new bunyan.ConsoleFormattedStream(),
                            type: 'raw'
                        }
                    ],
                    src: localStorage.getItem('logsrc') == 'true'
                });

                return $delegate;
            });
        });
    }

    adminApp.factory('errorFactory', function() {
        return {
            createResponseError: function(res) {
                var data = res.data;
                var message = res.statusText;
                if(data.message) {
                    message += ': ' + data.message;
                }
                var err = new Error(message);
                if(data.stack) {
                    err.stack = data.stack;
                }
                err.status = res.status;
                return err;
            }
        };
    });

    adminApp.controller('MainController', function($scope, $location, $log, $timeout, pageService) {
        
        $scope.navClass = '';
        
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
                }).then(function(pages) {
                    if(pages.length  === 1) {
                        $scope.viewPageName = pages[0].name;
                        $scope.viewPageUrlPublished = pages[0].published;
                    }
                });
            } else {
                $scope.viewPageUrl = null;
            }
            
            $scope.navClass = '';
        });

        //notifications
        $scope.message = null;

        function showMessage(text, type, icon) {
            $scope.message = {
                type: type,
                text: text,
                icon: icon
            };
        }

        $scope.showSuccess = function(text) {
            console.log(text);
            showMessage(text, 'success', 'ok');
        };

        $scope.showInfo = function(text) {
            console.log(text);
            showMessage(text, 'info', 'info-sign');
        };

        $scope.showWarning = function(text) {
            console.warn(text);
            showMessage(text, 'warning', 'exclamation-sign');
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
            showMessage(message, 'danger', 'exclamation-sign');
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
            }, 1000 * 6);
        });
        
        function moveInclude(pageId, regionName, fromIndex, toIndex) {
            pageService.getPage(pageId).then(function(page) {
                page = pageService.moveInclude(page, regionName, fromIndex, toIndex);
                page = pageService.depopulatePage(page);
                pageService.updatePage(pageId, page).then(function() {
                    $log.info('Includes (%s and %s) swapped for pageId=%s, region=%s',
                        fromIndex, toIndex, pageId, regionName);

                    //reload iframe, preserving scroll position
                    var viewPageFrame = document.getElementById('view-page-frame');
                    var viewPageScroll = {
                        x: viewPageFrame.contentWindow.scrollX,
                        y: viewPageFrame.contentWindow.scrollY
                    };
                    viewPageFrame.onload = function() {
                        viewPageFrame.contentWindow.scrollTo(viewPageScroll.x, viewPageScroll.y);
                    };
                    viewPageFrame.contentWindow.location.reload();
                }).catch(function(err) {
                    $scope.err = err;
                    $log.error(err, 'Failed to swap includes (%s and %s) swapped for pageId=%s, region=%s',
                        fromIndex, toIndex, pageId, regionName);
                });
            }).catch(function(err) {
                $scope.err = err;
                $log.error(err, 'Unable to get page: %s', pageId);
            });
        }

        function editInclude(pageId, pluginName, includeId, regionName) {
            $scope.$broadcast('edit-include', pageId, pluginName, includeId, regionName);
        }

        function addInclude(pageId, regionName) {
            $scope.$broadcast('add-include', pageId, regionName);
        }

        window.addEventListener('message', function(ev) {
            if(ev.origin === window.location.origin) {
                if(ev.data.name === 'drag-include-start') {
                    document.body.classList.add('dragging-include');
                } else if(ev.data.name === 'drag-include-end') {
                    document.body.classList.remove('dragging-include');
                } else if(ev.data.name === 'move-include') {
                    moveInclude(ev.data.pageId, ev.data.regionName, ev.data.fromIndex, ev.data.toIndex);
                } else if(ev.data.name === 'edit-include') {
                    editInclude(ev.data.pageId, ev.data.pluginName, ev.data.includeId, ev.data.regionName);
                } else if(ev.data.name === 'add-include') {
                    addInclude(ev.data.pageId, ev.data.regionName);
                }
            }
        });
        
        $scope.toggleNav = function () {
            $scope.navClass = $scope.navClass ? '' : 'header-nav-open';
        };
    });
})();
