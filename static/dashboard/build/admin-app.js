'use strict';

/* globals console */
(function () {
    var adminApp = angular.module('adminApp', ['ngRoute', 'ngTagsInput', 'focus-if', 'ui.codemirror']);

    adminApp.config(['$routeProvider', '$provide', '$httpProvider', function ($routeProvider, $provide, $httpProvider) {
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
        }).when('/remove-include/:pageId/:region/:include', {
            templateUrl: '/_static/dashboard/app/inpage/remove-include.html',
            controller: 'RemoveIncludeController'
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
        }).when('/pages/new/:parentPageId/:order', {
            templateUrl: '/_static/dashboard/app/pages/page/page.html',
            controller: 'PageController'
        }).when('/pages/:pageId', {
            templateUrl: '/_static/dashboard/app/pages/page/page.html',
            controller: 'PageController'
        }).when('/pages/delete/:pageId', {
            templateUrl: '/_static/dashboard/app/pages/page/delete-page.html',
            controller: 'DeletePageController'
        }).when('/pages/configure/:section/:pageId', {
            templateUrl: '/_static/dashboard/app/pages/page/page.html',
            controller: 'PageController'
        }).

        //view page
        when('/view-page/:viewPageEnv', {
            templateUrl: '/_static/dashboard/app/pages/view/view-page.html',
            controller: 'ViewPageController'
        }).when('/view-page/:viewPageEnv/:url*', {
            templateUrl: '/_static/dashboard/app/pages/view/view-page.html',
            controller: 'ViewPageController'
        }).

        //view json
        when('/view-json/:url*', {
            templateUrl: '/_static/dashboard/app/pages/view/view-json.html',
            controller: 'ViewJsonController'
        }).

        //plugins
        when('/plugins', {
            templateUrl: '/_static/dashboard/app/plugins/plugin-list.html',
            controller: 'PluginListController'
        }).when('/plugins/new', {
            templateUrl: '/_static/dashboard/app/plugins/plugin.html',
            controller: 'PluginController'
        }).when('/plugins/:pluginId', {
            templateUrl: '/_static/dashboard/app/plugins/plugin.html',
            controller: 'PluginController'
        }).

        //publishing
        when('/publishing', {
            templateUrl: '/_static/dashboard/app/publishing/publishing.html',
            controller: 'PublishingController'
        }).when('/publishing/:pageId', {
            templateUrl: '/_static/dashboard/app/publishing/publishing.html',
            controller: 'PublishingController'
        }).when('/publishing/compare/:pageId*', {
            templateUrl: '/_static/dashboard/app/publishing/compare.html',
            controller: 'CompareController'
        }).

        //media
        when('/media', {
            templateUrl: '/_static/dashboard/app/media/media.html',
            controller: 'MediaController'
        }).when('/media/upload', {
            templateUrl: '/_static/dashboard/app/media/media-upload.html',
            controller: 'MediaUploadController'
        }).when('/media/:mediaId', {
            templateUrl: '/_static/dashboard/app/media/media-item.html',
            controller: 'MediaItemController'
        }).

        //macros
        when('/macros', {
            templateUrl: '/_static/dashboard/app/macros/macro-list.html',
            controller: 'MacroListController'
        }).when('/macros/new', {
            templateUrl: '/_static/dashboard/app/macros/macro.html',
            controller: 'MacroController'
        }).when('/macros/:macroId', {
            templateUrl: '/_static/dashboard/app/macros/macro.html',
            controller: 'MacroController'
        }).

        //templates
        when('/templates', {
            templateUrl: '/_static/dashboard/app/templates/template-list.html',
            controller: 'TemplateListController'
        }).when('/templates/new', {
            templateUrl: '/_static/dashboard/app/templates/template.html',
            controller: 'TemplateController'
        }).when('/templates/:templateId', {
            templateUrl: '/_static/dashboard/app/templates/template.html',
            controller: 'TemplateController'
        }).

        //users
        when('/users', {
            templateUrl: '/_static/dashboard/app/users/user-list.html',
            controller: 'UserListController'
        }).when('/users/new', {
            templateUrl: '/_static/dashboard/app/users/user.html',
            controller: 'UserController'
        }).when('/users/:userId', {
            templateUrl: '/_static/dashboard/app/users/user.html',
            controller: 'UserController'
        }).

        //default to sitemap
        otherwise({
            templateUrl: '/_static/dashboard/app/pages/site-map.html',
            controller: 'SitemapController'
        });

        $httpProvider.interceptors.push(function ($q, $window, $timeout) {
            return {
                // optional method
                'responseError': function responseError(response) {
                    var status = response.status;
                    if (status === 401) {
                        $timeout(function () {
                            $window.location.href = '/_auth/login';
                        }, 1000);
                    }
                    return $q.reject(response);
                }
            };
        });
    }]);

    if (window.bunyan) {
        adminApp.config(function ($provide) {
            $provide.decorator('$log', function ($delegate) {
                $delegate = bunyan.createLogger({
                    name: 'pagespace',
                    streams: [{
                        level: localStorage.getItem('loglevel') || 'info',
                        stream: new bunyan.ConsoleFormattedStream(),
                        type: 'raw'
                    }],
                    src: localStorage.getItem('logsrc') == 'true'
                });

                return $delegate;
            });
        });
    }

    adminApp.factory('errorFactory', function () {
        return {
            createResponseError: function createResponseError(res) {
                var data = res.data;
                var message = res.statusText;
                if (data.message) {
                    message += ': ' + data.message;
                }
                var err = new Error(message);
                if (data.stack) {
                    err.stack = data.stack;
                }
                err.status = res.status;
                return err;
            }
        };
    });

    adminApp.controller('MainController', function ($scope, $location, $log, $timeout, pageService) {

        $scope.navClass = '';

        $scope.menuClass = function (page) {

            //default page
            var path = $location.path();
            if (path === '/') {
                path = '/pages';
            }
            var match = path.indexOf(page) === 0;
            return match ? 'active' : '';
        };

        $scope.$on('$routeChangeStart', function (ev, next) {
            if (next.params && next.params.viewPageEnv) {
                var url = '/' + (next.params.url || '');
                $scope.viewPageUrl = url;

                $scope.viewPageUrlPublished = false;
                pageService.getPages({
                    url: url
                }).then(function (pages) {
                    if (pages.length === 1) {
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

        $scope.showSuccess = function (text) {
            console.log(text);
            showMessage(text, 'success', 'ok');
        };

        $scope.showInfo = function (text) {
            console.log(text);
            showMessage(text, 'info', 'info-sign');
        };

        $scope.showWarning = function (text) {
            console.warn(text);
            showMessage(text, 'warning', 'exclamation-sign');
        };

        $scope.showError = function (text, err) {
            console.error(text);
            if (err) {
                console.error(err);
            }
            var message = text;
            if (err.message) {
                message += ': ' + err.message;
            }
            if (err.status) {
                message += ' (' + err.status + ')';
            }
            showMessage(message, 'danger', 'exclamation-sign');
        };

        $scope.clearNotification = function () {
            $scope.message = null;
        };
        $scope.clear = function () {
            $scope.message = null;
        };

        var hideTimeout = null;
        $scope.$watch('message', function () {
            $timeout.cancel(hideTimeout);
            hideTimeout = $timeout(function () {
                $scope.message = null;
            }, 1000 * 6);
        });

        function swapIncludes(pageId, regionName, includeOne, includeTwo) {
            pageService.getPage(pageId).then(function (page) {
                page = pageService.swapIncludes(page, regionName, parseInt(includeOne), parseInt(includeTwo));
                page = pageService.depopulatePage(page);
                pageService.updatePage(pageId, page).then(function () {
                    $log.info('Includes (%s and %s) swapped for pageId=%s, region=%s', includeOne, includeTwo, pageId, regionName);
                    window.location.reload();
                }).catch(function (err) {
                    $scope.err = err;
                    $log.error(err, 'Failed to swap includes (%s and %s) swapped for pageId=%s, region=%s', includeOne, includeTwo, pageId, regionName);
                });
            }).catch(function (err) {
                $scope.err = err;
                $log.error(err, 'Unable to get page: %s', pageId);
            });
        }

        function moveInclude(pageId, regionName, fromIndex, toIndex) {
            pageService.getPage(pageId).then(function (page) {
                page = pageService.moveInclude(page, regionName, fromIndex, toIndex);
                page = pageService.depopulatePage(page);
                pageService.updatePage(pageId, page).then(function () {
                    $log.info('Includes (%s and %s) swapped for pageId=%s, region=%s', fromIndex, toIndex, pageId, regionName);

                    //reload iframe, preserving scroll position
                    var viewPageFrame = document.getElementById('view-page-frame');
                    var viewPageScroll = {
                        x: viewPageFrame.contentWindow.scrollX,
                        y: viewPageFrame.contentWindow.scrollY
                    };
                    viewPageFrame.onload = function () {
                        viewPageFrame.contentWindow.scrollTo(viewPageScroll.x, viewPageScroll.y);
                    };
                    viewPageFrame.contentWindow.location.reload();
                }).catch(function (err) {
                    $scope.err = err;
                    $log.error(err, 'Failed to swap includes (%s and %s) swapped for pageId=%s, region=%s', fromIndex, toIndex, pageId, regionName);
                });
            }).catch(function (err) {
                $scope.err = err;
                $log.error(err, 'Unable to get page: %s', pageId);
            });
        }

        window.addEventListener('message', function (ev) {
            if (ev.origin === window.location.origin) {
                if (ev.data.name === 'drag-include-start') {
                    document.body.classList.add('dragging-include');
                } else if (ev.data.name === 'drag-include-end') {
                    document.body.classList.remove('dragging-include');
                } else if (ev.data.name === 'move-include') {
                    moveInclude(ev.data.pageId, ev.data.regionName, ev.data.fromIndex, ev.data.toIndex);
                }
            }
        });

        $scope.toggleNav = function () {
            $scope.navClass = $scope.navClass ? '' : 'header-nav-open';
        };
    });
})();
'use strict';

(function () {
    var adminApp = angular.module('adminApp');
    adminApp.directive('bsHasError', function () {
        return {
            restrict: 'A',
            link: function link(scope, element, attrs) {
                //find parent form
                function getClosestFormName(element) {
                    var parent = element.parent();
                    if (parent[0].tagName.toLowerCase() === 'form') {
                        return parent.attr('name') || null;
                    } else {
                        return getClosestFormName(parent);
                    }
                }
                var formName = getClosestFormName(element);
                var fieldName = attrs.bsHasError;

                if (formName && fieldName) {
                    var field = scope[formName][fieldName];
                    if (field) {
                        scope.$watch(function () {
                            element.toggleClass('has-error', field.$invalid && (field.$dirty || !!scope.submitted));
                            element.toggleClass('has-success', field.$valid && field.$dirty);
                        });
                    }
                }
            }
        };
    });
})();
'use strict';

(function () {
    var adminApp = angular.module('adminApp');
    adminApp.directive('psFieldMatch', function () {
        return {
            require: 'ngModel',
            link: function link(scope, element, attrs, model) {

                function getClosestFormName(element) {
                    var parent = element.parent();
                    if (parent[0].tagName.toLowerCase() === 'form') {
                        return parent.attr('name') || null;
                    } else {
                        return getClosestFormName(parent);
                    }
                }
                var formName = getClosestFormName(element);
                var fieldName = attrs.psFieldMatch;
                if (formName && fieldName) {
                    var field = scope[formName][fieldName];
                    model.$parsers.push(function (value) {
                        var valid = value === field.$viewValue;
                        model.$setValidity('psFieldMatch', valid);
                        return valid ? value : undefined;
                    });
                }
            }
        };
    });
})();
'use strict';

(function () {

    var adminApp = angular.module('adminApp');
    adminApp.controller('AddIncludeController', function ($log, $scope, $routeParams, $q, pageService, pluginService) {

        var pageId = $routeParams.pageId;
        var regionName = $routeParams.region;

        $scope.selectedPlugin = null;

        var pluginsPromise = pluginService.getPlugins();
        var pagePromise = pageService.getPage(pageId);

        $q.all([pluginsPromise, pagePromise]).then(function (results) {
            $scope.availablePlugins = results[0];
            $scope.page = results[1];

            $log.debug('Got available plugins and page ok');
        }).catch(function (err) {
            $scope.err = err;
            $log.error(err, 'Unable to get data');
        });

        $scope.selectPlugin = function (plugin) {
            $scope.selectedPlugin = plugin;
        };

        $scope.addInclude = function () {

            var page = $scope.page;

            //map region name to index
            var regionIndex = pageService.getRegionIndex(page, regionName);

            //add a new region
            if (regionIndex === null) {
                pageService.addRegion(page, regionName);
            }

            //add the new include to the region
            if ($scope.selectedPlugin) {
                pageService.createIncludeData($scope.selectedPlugin).then(function (includeData) {
                    pageService.addIncludeToPage(page, regionIndex, $scope.selectedPlugin, includeData);
                    page = pageService.depopulatePage(page);
                    return pageService.updatePage(pageId, page);
                }).then(function () {
                    $scope.close();
                }).catch(function (err) {
                    $log.error(err, 'Update page to add include failed (pageId=%s, region=%s)', pageId, regionIndex);
                });
            } else {
                $log.error('Unable to determine region index for new include (pageId=%s, region=%s)', pageId, regionName);
            }
        };

        $scope.close = function () {
            window.parent.parent.location.reload();
        };
    });
})();
'use strict';

(function () {

    var adminApp = angular.module('adminApp');

    adminApp.directive('removeIncludeDrop', function () {
        return {
            replace: true,
            transclude: true,
            template: '<div ng-transclude class="remove-include-drop"></div>',
            link: function link(scope, element) {

                var dragCounter = 0;
                element[0].addEventListener('dragenter', function (ev) {
                    if (containsType(ev.dataTransfer.types, 'include-info')) {
                        dragCounter++;
                        this.classList.add('drag-over');
                        ev.preventDefault();
                    }
                });
                element[0].addEventListener('dragover', function (ev) {
                    if (containsType(ev.dataTransfer.types, 'include-info')) {
                        ev.dataTransfer.dropEffect = 'move';
                        ev.preventDefault();
                    }
                });
                element[0].addEventListener('dragleave', function (ev) {
                    if (containsType(ev.dataTransfer.types, 'include-info')) {
                        dragCounter--;
                        if (dragCounter === 0) {
                            this.classList.remove('drag-over');
                            ev.preventDefault();
                        }
                    }
                });
                element[0].addEventListener('drop', function (ev) {
                    if (containsType(ev.dataTransfer.types, 'include-info')) {
                        var data = ev.dataTransfer.getData('include-info');
                        data = JSON.parse(data);
                        var pageId = data.pageId;
                        var regionName = data.region;
                        var includeIndex = parseInt(data.includeIndex);
                        scope.remove(pageId, regionName, includeIndex);
                        ev.preventDefault();
                    }
                });

                function containsType(list, value) {
                    for (var i = 0; i < list.length; ++i) {
                        if (list[i] === value) {
                            return true;
                        }
                    }
                    return false;
                }
            },
            controller: function controller($log, $scope, pageService) {
                $scope.remove = function (pageId, regionName, includeIndex) {
                    pageService.getPage(pageId).then(function (page) {
                        page = pageService.removeInclude(page, regionName, includeIndex);
                        page = pageService.depopulatePage(page);
                        pageService.updatePage(pageId, page).then(function () {
                            $log.info('Include removed for pageId=%s, region=%s, include=%s', pageId, regionName, includeIndex);
                            window.location.reload();
                        }).catch(function (err) {
                            $scope.err = err;
                            $log.error(err, 'Update page to remove include failed (pageId=%s, region=%s, include=%s', pageId, regionName, includeIndex);
                        });
                    }).catch(function (err) {
                        $scope.err = err;
                        $log.error(err, 'Unable to get page: %s', pageId);
                    });
                };
            }
        };
    });
})();
'use strict';

(function () {

    /**
     *
     * @type {*}
     */
    var adminApp = angular.module('adminApp');
    adminApp.controller('MediaController', function ($scope, $rootScope, $location, $window, $q, mediaService) {
        $rootScope.pageTitle = 'Media';

        $scope.files = [];

        $scope.mediaItems = [];
        $scope.filteredItems = [];
        $scope.availableTags = [];
        $scope.selectedTags = [];

        $scope.getTypeShortName = mediaService.getTypeShortName;
        $scope.getSrcPath = mediaService.getSrcPath;

        $scope.clearFiles = function () {
            $scope.files = [];
        };

        $scope.toggleEditing = function (item) {
            item._editing = !item._editing;
        };

        $scope.setItems = function (items) {
            $scope.mediaItems = items;
        };

        function compareTags(a, b) {
            if (a.text < b.text) {
                return -1;
            }
            if (a.text > b.text) {
                return 1;
            }
            return 0;
        }

        $scope.getItems = function () {
            mediaService.getItems().then(function (items) {
                $scope.setItems(items);
                $scope.updateFilter();

                //combine all tags into one
                var availableTags = items.reduce(function (allTags, item) {
                    return allTags.concat(item.tags.filter(function (tag) {
                        return tag.text; //only return tags with text property
                    }));
                }, []);

                //remove dups
                var seen = {};
                availableTags = availableTags.filter(function (tag) {
                    return seen.hasOwnProperty(tag.text) ? false : seen[tag.text] = true;
                });
                $scope.availableTags = availableTags.sort(compareTags);
            }).catch(function (err) {
                $scope.showError('Error getting media items', err);
            });
        };

        $scope.getMatchingTags = function (text) {
            text = text.toLowerCase();
            return $q(function (resolve) {
                resolve($scope.availableTags.filter(function (tag) {
                    return tag.text && tag.text.toLowerCase().indexOf(text) > -1;
                }));
            });
        };

        $scope.toggleTag = function (tag) {
            if (tag.on) {
                deselectTag(tag);
            } else {
                selectTag(tag);
            }
        };

        $scope.addTag = function (newTag) {
            var exists = $scope.availableTags.some(function (availableTag) {
                return availableTag.text === newTag.text;
            });
            if (!exists) {
                $scope.availableTags.push(newTag);
            }
            $scope.availableTags.sort(compareTags);
        };

        function selectTag(newTag) {
            newTag.on = true;
            var alreadyExists = $scope.selectedTags.some(function (tag) {
                return newTag.text === tag.text;
            });
            if (!alreadyExists) {
                $scope.selectedTags.push(newTag);
            }
            $scope.updateFilter();
        }

        function deselectTag(oldTag) {
            oldTag.on = false;
            $scope.selectedTags = $scope.selectedTags.filter(function (tag) {
                return oldTag.text !== tag.text;
            });
            $scope.updateFilter();
        }

        $scope.updateFilter = function () {

            if ($scope.selectedTags.length === 0) {
                $scope.filteredItems = $scope.mediaItems;
                return;
            }

            $scope.filteredItems = $scope.mediaItems.filter(function (item) {
                return item.tags.some(function (tag) {
                    return $scope.selectedTags.some(function (selectedTag) {
                        return selectedTag.text === tag.text;
                    });
                });
            });
        };
    });
})();
'use strict';

(function () {

    var tmpl = '\n         <div class="list-group col-sm-11">\n            <div class="notification-bar">\n                <h4>Media library</h4>\n            </div>\n             <div ng-repeat="item in filteredItems" class="media-item list-group-item">    \n                <div class="media-item-part clearfix">\n                    <div class="btn-group pull-right">\n                        <button type="button" class="btn btn-default" title="Cancel"\n                                ng-show="item._editing" ng-click="revertItem(item)">\n                            <span class="glyphicon glyphicon glyphicon-remove"></span>\n                        </button>\n                        <button type="button" class="btn btn-primary" title="Update"\n                                ng-show="item._editing" ng-click="updateItem(item)">                                \n                            <span class="glyphicon glyphicon glyphicon-ok"></span>\n                        </button>\n                        <button type="button" class="btn btn-default" title="Edit" \n                                ng-show="!item._editing" ng-click="item._editing = !item._editing">\n                            <span class="glyphicon glyphicon-pencil"></span>\n                        </button>      \n                        <button type="button" class="btn btn-default" title="Delete" \n                                ng-show="!item._editing" ng-click="deleteItem(item)">\n                            <span class="glyphicon glyphicon-trash"></span>\n                        </button> \n                    </div>     \n                    <div class="media-item-preview" style="cursor: pointer;">\n                        <img ng-src="{{getSrcPath(item, \'thumb\', \'/_static/dashboard/styles/types/file.png\')}}" \n                             ng-click="!item._editing ? showItem(item) : \'\'" \n                             alt="{{item.name}}" title="{{item.type}}">\n                        <span class="item-type" ng-if="!isImage(item)">{{getTypeShortName(item)}}</span>\n                    </div>                     \n                    <div ng-if="!item._editing" class="media-item-view"> \n                        <h3>{{item.name}}</h3>\n                        <p><span class="label label-primary" ng-repeat="tag in item.tags">{{tag.text}}</span></p>       \n                        <p><small>\n                            <a href="/_media/{{item.fileName}}" target="_blank">/_media/{{item.fileName}}</a>\n                        </small></p>                                         \n                    </div>\n                    <div ng-if="item._editing" class="media-item-edit">\n                        <input placeholder="Name" ng-model="item.name" required class="form-control">\n                        <tags-input ng-model="item.tags" on-tag-added="addTag($tag)" \n                            placeholder="Add tags to help manage your files">\n                            <auto-complete source="getMatchingTags($query)"></auto-complete>\n                        </tags-input>         \n                    </div>   \n                </div>                                                          \n            </div>\n            <p ng-if="!mediaItems.length">The media library is empty</p>\n            <p ng-if="mediaItems.length && !filteredItems.length">No items match this filter</p>\n        </div>';

    var adminApp = angular.module('adminApp');
    adminApp.directive('mediaItems', function () {
        return {
            scope: true,
            template: tmpl,
            link: function link(scope, element, mediaService) {

                //  scope.isImage = mediaService.isImage;
            },
            controller: function controller($log, $scope, $location, mediaService) {

                $scope.isImage = mediaService.isImage;
                $scope.getMimeClass = mediaService.getMimeClass;

                $scope.getItems();

                $scope.showItem = function (item) {
                    $location.path('/media/' + item._id);
                };

                $scope.deleteItem = function (item) {
                    var really = window.confirm('Really delete the item, ' + item.name + '?');
                    if (really) {
                        mediaService.deleteItem(item.fileName).then(function () {
                            $scope.getItems();
                            $scope.showInfo('Media: ' + item.name + ' removed.');
                        }).catch(function (err) {
                            $scope.showError('Error deleting page', err);
                        });
                    }
                };

                $scope.revertItem = function (item) {
                    mediaService.getItem(item._id).then(function (itemFromServer) {
                        item.name = itemFromServer.name;
                        item.tags = itemFromServer.tags;
                        item._editing = false;
                    }).catch(function (err) {
                        $scope.showError('Error reverting item', err);
                    });
                };

                $scope.updateItem = function (item) {
                    mediaService.updateItem(item._id, item).then(function () {
                        item._editing = false;
                    }).catch(function (err) {
                        $scope.showError('Error updating item', err);
                    });
                };
            }
        };
    });
})();
'use strict';

(function () {

    var tmpl = '<form ng-if="files.length > 0" ng-submit="upload(uploadForm)" name="uploadForm" \n              class="form-horizontal media-upload-form" novalidate>\n            <div class="list-group col-sm-11">                     \n                <div class="notification-bar">\n                    <h4>Prepare media to add</h4>\n                </div>\n                <div ng-repeat="file in files" ng-click="showItem(item)" class="media-item list-group-item">   \n                    <div class="media-item-part clearfix">\n                        <div class="btn-group pull-right">\n                            <button type="button" class="btn btn-default" title="Remove" tabindex="-1"\n                                    ng-click="remove(file)" ng-disabled="uploading">\n                                <span class="glyphicon glyphicon-trash"></span>\n                            </button>      \n                        </div>\n                        <div class="media-item-preview">\n                            <img ng-src="{{getSrcPath(file.item, null, \'/_static/dashboard/styles/types/file.png\')}}" \n                                 alt="{{file.item.name}}" title="{{file.item.type}}">\n                            <span class="item-type" ng-if="!isImage(file.item)">{{getTypeShortName(file.item)}}</span>\n                        </div>   \n                        <div class="media-item-edit">\n                            <input placeholder="Name" ng-model="file.item.name" required class="form-control">   \n                            <tags-input ng-model="file.item.tags" on-tag-added="addTag($tag)" \n                                        placeholder="Add tags to help manage your files">\n                                <auto-complete source="getMatchingTags($query)"></auto-complete>\n                            </tags-input>     \n                            <p style="margin-top: 1em"><small>/_media/{{file.name}}</small></p>   \n                        </div>                 \n                    </div>\n                </div>                              \n            </div>\n            <div class="action-buttons col-sm-11">\n                <button type="submit" class="btn btn-primary" ng-disabled="uploading">                    \n                    <ng-pluralize count="files.length"\n                                  when="{\'one\': \'Add file\', \'other\': \'Add {} files\'}">\n                    </ng-pluralize>\n                </button>\n                <button ng-click="cancel()" ng-disabled="uploading" \n                    type="button" class="btn btn-default" >Cancel</button>\n            </div>     \n        </form>';

    var adminApp = angular.module('adminApp');
    adminApp.directive('mediaPreview', function () {
        return {
            scope: true,
            template: tmpl,
            controller: function controller($scope, $window, $q, $location, mediaService) {

                $scope.uploading = false;
                $scope.isImage = mediaService.isImage;
                $scope.getMimeClass = mediaService.getMimeClass;

                $scope.remove = function (file) {
                    var selectedFiles = $scope.files;
                    for (var i = selectedFiles.length - 1; i >= 0; i--) {
                        if (selectedFiles[i].name === file.name) {
                            selectedFiles.splice(i, 1);
                        }
                    }
                };

                function generateName(fileName) {
                    return fileName.split('.')[0].split(/-|_/).map(function (part) {
                        return part.charAt(0).toUpperCase() + part.slice(1);
                    }).join(' ');
                }

                $scope.setFiles = function (newFiles) {
                    var existingFilePaths = $scope.files.map(function (file) {
                        return file.name;
                    });

                    for (var i = 0; i < newFiles.length; i++) {
                        var file = newFiles[i];

                        var alreadySelected = existingFilePaths.indexOf(file.name) > -1; //already selected
                        var tooBig = file.size > 1024 * 1024 * 100; //too big. TODO: inform user

                        if (alreadySelected || tooBig) {
                            continue;
                        }

                        file.item = {
                            fileSrc: null,
                            type: file.type,
                            tags: []
                        };
                        if (mediaService.isImage(file)) {
                            (function (file) {
                                var reader = new FileReader();
                                reader.readAsDataURL(file);
                                reader.onload = function (e) {
                                    file.item.fileSrc = e.target.result;
                                    $scope.$apply();
                                };
                            })(file);
                        }

                        file.item.name = generateName(file.name);
                        $scope.files.push(file);
                    }
                };

                $scope.upload = function () {

                    if ($scope.files.length > 4) {
                        var msg = 'Are you ready to upload the chosen files?';
                        if (!$window.confirm(msg)) {
                            return;
                        }
                    }

                    var formData = new FormData();
                    var i, file;
                    for (i = 0; i < $scope.files.length; i++) {
                        file = $scope.files[i];
                        formData.append('file_' + i, file);
                        formData.append('name_' + i, file.item.name);
                        formData.append('description_' + i, file.item.description);
                        formData.append('tags_' + i, JSON.stringify(file.item.tags));
                    }

                    mediaService.uploadItem(formData).then(function () {
                        $scope.uploading = true;
                        $scope.showSuccess('Upload successful');
                    }).catch(function (err) {
                        $scope.showError('Error uploading file', err);
                    }).finally(function () {
                        $scope.clearFiles();
                        $scope.getItems();
                        $scope.uploading = false;
                    });
                    $scope.showInfo('Upload in progress...');
                };

                $scope.cancel = function () {
                    if ($scope.files.length > 4) {
                        var msg = 'Really cancel this upload?';
                        if ($window.confirm(msg)) {
                            $scope.clearFiles();
                        }
                    } else {
                        $scope.clearFiles();
                    }
                };

                var confirmExitMsg = 'There are files ready to upload. Are you sure you want to navigate away?';
                $scope.$on('$locationChangeStart', function (ev) {
                    if ($scope.files.length > 0 && !$window.confirm(confirmExitMsg)) {
                        ev.preventDefault();
                    }
                });

                $window.onbeforeunload = function () {
                    return $scope.files.length > 0 ? confirmExitMsg : undefined;
                };
            }
        };
    });
})();
'use strict';

(function () {
    var adminApp = angular.module('adminApp');
    adminApp.factory('mediaService', function ($http, $log, errorFactory) {

        var mimeTypeShortNames = {
            'audio/basic': 'audio',
            'video/msvideo': 'video',
            'video/avi': 'video',
            'image/bmp': 'bitmap',
            'text/css': 'css',
            'application/msword': 'word',
            'image/gif': 'gif',
            'application/x-gzip': 'gzip',
            'text/html': 'html',
            'image/jpeg': 'jpeg',
            'application/x-javascript': 'js',
            'audio/x-midi': 'midi',
            'video/mpeg': 'video',
            'audio/vorbis': 'ogg',
            'application/ogg': 'ogg',
            'application/pdf': 'pdf',
            'image/png': 'png',
            'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'ppt',
            'video/quicktime': 'qt',
            'image/svg+xml': 'svg',
            'application/x-shockwave-flash': 'flash',
            'application/x-tar': 'tar',
            'image/tiff': 'tar',
            'text/plain': 'text',
            'audio/wav, audio/x-wav': 'wav',
            'application/vnd.ms-excel': 'excel',
            'application/xml': 'xml',
            'application/zip': 'zip'
        };

        function MediaService() {}

        MediaService.prototype.getItems = function () {
            return $http.get('/_api/media').then(function (res) {
                return res.data;
            }).catch(function (res) {
                throw errorFactory.createResponseError(res);
            });
        };

        MediaService.prototype.getItem = function (mediaId) {
            return $http.get('/_api/media/' + mediaId).then(function (res) {
                return res.data;
            }).catch(function (res) {
                throw errorFactory.createResponseError(res);
            });
        };

        MediaService.prototype.updateItem = function (mediaId, mediaData) {
            return $http.put('/_api/media' + mediaId, mediaData).then(function (res) {
                return res.data;
            }).catch(function (res) {
                throw errorFactory.createResponseError(res);
            });
        };

        MediaService.prototype.updateItemText = function (mediaData, content) {
            return $http.put('/_media/' + mediaData.fileName, {
                content: content
            }).then(function (res) {
                return res.data;
            }).catch(function (res) {
                throw errorFactory.createResponseError(res);
            });
        };

        MediaService.prototype.deleteItem = function (fileName) {
            return $http.delete('/_media/' + fileName).then(function (res) {
                return res.data;
            }).catch(function (res) {
                throw errorFactory.createResponseError(res);
            });
        };

        MediaService.prototype.uploadItem = function (formData) {
            //store upload in session, then accept media data
            return $http.post('/_media', formData, {
                withCredentials: true,
                headers: { 'Content-Type': undefined },
                transformRequest: angular.identity
            }).then(function (res) {
                return res.data;
            }).catch(function (res) {
                throw errorFactory.createResponseError(res);
            });
        };

        MediaService.prototype.getItemText = function (item) {
            return $http.get('/_media/' + item.fileName).then(function (res) {
                return res.data;
            }).catch(function (res) {
                throw errorFactory.createResponseError(res);
            });
        };

        MediaService.prototype.getImageVariations = function () {
            return $http.get('/_dashboard/settings').then(function (res) {
                var settings = res.data;
                return settings.imageVariations || [];
            }).then(function (res) {
                return res.data;
            }).catch(function (res) {
                throw errorFactory.createResponseError(res);
            });
        };

        //some utils
        MediaService.prototype.isImage = function (item) {
            return item && item.type && !!item.type.match(/^image/);
        };
        MediaService.prototype.isText = function (item) {
            return item && item.type && !!item.type.match(/text\/[plain|json|html]/);
        };
        MediaService.prototype.isDocument = function (item) {
            return item && item.type && !!item.type.match(/application\/pdf/);
        };

        MediaService.prototype.getMimeClass = function (item) {
            return 'media-' + item.type.split('/')[1];
        };

        MediaService.prototype.getSrcPath = function (item, label, fallback) {
            var src = null;

            if (this.isImage(item)) {
                if (item.fileSrc) {
                    src = item.fileSrc;
                } else if (item.fileName) {
                    src = '/_media/' + item.fileName;
                    if (label) {
                        src += '?label=' + label;
                    }
                }
            } else {
                src = fallback;
            }

            return src;
        };

        MediaService.prototype.getTypeShortName = function (item) {

            if (mimeTypeShortNames[item.type]) {
                return mimeTypeShortNames[item.type];
            }

            try {
                return item.fileName.split('\.')[1].toLowerCase();
            } catch (err) {
                $log.warn(err);
                return '???';
            }
        };

        /* jshint ignore:start */
        //thanks http://stackoverflow.com/a/14919494/200113
        MediaService.prototype.humanFileSize = function (bytes) {
            var exp = Math.log(bytes) / Math.log(1024) | 0;
            var result = (bytes / Math.pow(1024, exp)).toFixed(2);

            return result + ' ' + (exp == 0 ? 'bytes' : 'KMGTPEZY'[exp - 1] + 'B');
        };
        /* jshint ignore:end */

        return new MediaService();
    });
})();
'use strict';

(function () {

    var tmpl = '<div class="media-file-select" ng-click="selectFiles()">\n            <input type="file" multiple="true" class="ng-hide">\n            <button class="btn btn-link">\n                <span class="glyphicon glyphicon-plus"></span>\n                <span class="add-text">Add files to library</span>\n                <span class="drop-text">Drop to add files</span>\n            </button>\n        </div>';

    var adminApp = angular.module('adminApp');
    adminApp.directive('mediaUpload', function () {
        return {
            scope: true,
            template: tmpl,
            link: function link(scope, element) {

                var rootEl = element[0];

                var fileInputEl = rootEl.querySelector('input');
                fileInputEl.addEventListener('change', function () {
                    scope.setFiles(this.files);
                    fileInputEl.value = '';
                });

                scope.selectFiles = function () {
                    setTimeout(function () {
                        fileInputEl.click();
                    }, 0);
                };

                var dragCounter = 0;
                rootEl.addEventListener('dragenter', function (ev) {
                    dragCounter++;
                    this.classList.add('media-item-dragging');
                    ev.preventDefault();
                });
                rootEl.addEventListener('dragover', function (ev) {
                    ev.dataTransfer.dropEffect = 'copy';
                    ev.preventDefault();
                });
                rootEl.addEventListener('dragleave', function (ev) {
                    dragCounter--;
                    if (dragCounter === 0) {
                        this.classList.remove('media-item-dragging');
                        ev.preventDefault();
                    }
                });

                rootEl.addEventListener("drop", function (ev) {
                    ev.stopPropagation();
                    ev.preventDefault();

                    var dt = ev.dataTransfer;
                    scope.setFiles(dt.files);
                    fileInputEl.value = '';
                    this.classList.remove('media-item-dragging');
                }, false);
            },
            controller: function controller($scope, $window, $q, $location, mediaService) {

                $scope.uploading = false;
                $scope.isImage = mediaService.isImage;
                $scope.getMimeClass = mediaService.getMimeClass;

                function generateName(fileName) {
                    return fileName.split('.')[0].split(/-|_/).map(function (part) {
                        return part.charAt(0).toUpperCase() + part.slice(1);
                    }).join(' ');
                }

                $scope.setFiles = function (newFiles) {
                    var existingFilePaths = $scope.files.map(function (file) {
                        return file.name;
                    });

                    for (var i = 0; i < newFiles.length; i++) {
                        var file = newFiles[i];

                        var alreadySelected = existingFilePaths.indexOf(file.name) > -1; //already selected
                        var tooBig = file.size > 1024 * 1024 * 100; //too big. TODO: inform user

                        if (alreadySelected || tooBig) {
                            continue;
                        }

                        file.item = {
                            fileSrc: null,
                            type: file.type,
                            tags: []
                        };
                        if (mediaService.isImage(file)) {
                            (function (file) {
                                var reader = new FileReader();
                                reader.readAsDataURL(file);
                                reader.onload = function (e) {
                                    file.item.fileSrc = e.target.result;
                                    $scope.$apply();
                                };
                            })(file);
                        }

                        file.item.name = generateName(file.name);
                        $scope.files.push(file);
                    }
                };
            }
        };
    });
})();
'use strict';

(function () {

    /**
     *
     * @type {*}
     */
    var adminApp = angular.module('adminApp');
    adminApp.controller('MediaItemController', function ($scope, $rootScope, $location, $routeParams, mediaService) {
        $rootScope.pageTitle = 'Media';

        $scope.isImage = mediaService.isImage;
        $scope.isText = mediaService.isText;
        $scope.isDocument = mediaService.isDocument;
        $scope.getSrcPath = mediaService.getSrcPath;
        $scope.humanFileSize = mediaService.humanFileSize;

        $scope.getDocSrcPath = function (item) {
            return item ? '/_media/' + item.fileName : null;
        };

        var mediaId = $routeParams.mediaId;

        $scope.cancel = function () {
            $location.path('/media');
        };

        mediaService.getItem(mediaId).then(function (item) {
            $scope.item = item;
            return mediaService.isText(item) ? mediaService.getItemText(item) : null;
        }).then(function (text) {
            if (text) {
                $scope.editorOpts = {
                    mode: 'xml'
                };
                $scope.itemText = text;
            }
        }).catch(function (err) {
            $scope.showError('Error getting media item', err);
        });

        $scope.updateItemText = function () {
            mediaService.updateItemText($scope.item, $scope.itemText).then(function () {
                $scope.showSuccess('Media item updated');
                $location.path('/media');
            }).catch(function (err) {
                $scope.showError('Could not update text media', err);
            });
        };
    });
})();
'use strict';

(function () {

    /**
     *
     * @type {*}
     */
    var adminApp = angular.module('adminApp');
    adminApp.controller('MacroController', function ($log, $scope, $rootScope, $routeParams, $location, $window, macroService, templateService, pluginService, pageService) {
        $log.info('Showing Macro View');

        $scope.getPageHierarchyName = pageService.getPageHierarchyName;

        var macroId = $routeParams.macroId;

        $scope.macro = {
            includes: []
        };

        $scope.allPages = [];
        var setupPromises = [];
        setupPromises.push(pageService.getPages().then(function (pages) {
            $scope.allPages = pages;
        }).catch(function (err) {
            $scope.showError('Couldn\'t get all pages', err);
        }));

        $scope.templates = [];
        setupPromises.push(templateService.doGetAvailableTemplates().then(function (templates) {
            $log.info('Got available templates.');
            $scope.templates = templates;
        }));

        $scope.plugins = [];
        setupPromises.push(pluginService.getPlugins().then(function (plugins) {
            $log.info('Got available plugins.');
            $scope.plugins = plugins;
        }));

        if (macroId) {
            $scope.macroId = macroId;
            $log.debug('Fetching macro data for id: %s...', macroId);
            setupPromises.push(macroService.getMacro(macroId).then(function (macro) {
                $log.debug('Got macro data:\n', JSON.stringify(macro, null, '\t'));
                $scope.macro = macro;
            }).catch(function (err) {
                $log.error(err, 'Error getting macro');
                $scope.showError('Error getting macro', err);
            }));
        }

        Promise.all(setupPromises).then(function () {
            //if there's only one template choose it automatically
            if ($scope.templates.length === 1) {
                $scope.macro.template = $scope.templates[0];
            }
        }).catch(function (err) {
            $scope.showError(err);
        });

        $scope.addInclude = function (regionName) {
            $scope.macro.includes.push({
                name: '',
                plugin: {},
                region: regionName,
                _justAdded: true
            });
        };
        $scope.clearJustAdded = function (include) {
            delete include._justAdded;
        };

        $scope.cancel = function () {
            $location.path('/macros');
        };

        $scope.save = function (form) {
            if (form.$invalid) {
                $window.scrollTo(0, 0);
                $scope.submitted = true;
                return;
            }

            var macro = macroService.depopulateMacro($scope.macro);
            if (macroId) {
                $log.info('Updating macro: %s...', macroId);
                $log.debug('with data:\n%s', JSON.stringify(macro, null, '\t'));
                macroService.updateMacro(macroId, macro).then(function () {
                    $log.info('Macro updated successfully');
                    $scope.showSuccess('Macro updated.');
                    $location.path('/macros');
                }).catch(function (err) {
                    $log.error(err, 'Error updating macro');
                    $scope.showError('Error updating macro', err);
                });
            } else {
                $log.info('Creating new macro...');
                $log.debug('with data:\n%s', JSON.stringify(macro, null, '\t'));
                macroService.createMacro($scope.macro).then(function () {
                    $log.info('Macro created successfully');
                    $scope.showSuccess('Macro created.');
                    $location.path('/macros');
                }).catch(function (err) {
                    $log.error(err, 'Error creating macro');
                    $scope.showError('Error creating macro', err);
                });
            }
        };

        $scope.remove = function () {
            var really = window.confirm('Really delete this macro?');
            if (really) {
                $log.info('Deleting macro: %s...', $scope.macro._id);
                macroService.deleteMacro($scope.macro._id).then(function () {
                    $log.info('Macro deleted');
                    $location.path('/macros');
                }).error(function (err) {
                    $log.error(err, 'Could not delete macro');
                    $scope.showError('Error deleting macro', err);
                });
            }
        };
    });
})();
'use strict';

(function () {

    /**
     *
     * @type {*}
     */
    var adminApp = angular.module('adminApp');
    adminApp.controller('MacroListController', function ($scope, $rootScope, $routeParams, $location, macroService) {

        $rootScope.pageTitle = 'Macros';

        $scope.macros = [];

        macroService.getMacros().then(function (macros) {
            $scope.macros = macros;
        }).catch(function (err) {
            $scope.showError('Error getting macros', err);
        });
    });
})();
'use strict';

(function () {
    var adminApp = angular.module('adminApp');
    adminApp.factory('macroService', function ($http, errorFactory) {

        function MacroService() {
            this.clearCache();
        }
        MacroService.prototype.getMacros = function () {
            var _this = this;

            if (Array.isArray(this.macroCache)) {
                return Promise.resolve(this.macroCache);
            }

            return $http.get('/_api/macros').then(function (res) {
                _this.macroCache = res.data;
                return res.data;
            }).catch(function (res) {
                throw errorFactory.createResponseError(res);
            });
        };
        MacroService.prototype.getMacro = function (macroId) {
            return $http.get('/_api/macros/' + macroId).then(function (res) {
                return res.data;
            }).catch(function (res) {
                throw errorFactory.createResponseError(res);
            });
        };
        MacroService.prototype.createMacro = function (macroData) {
            var _this2 = this;

            return $http.post('/_api/macros', macroData).then(function (res) {
                _this2.clearCache();
                return res.data;
            }).catch(function (res) {
                throw errorFactory.createResponseError(res);
            });
        };

        MacroService.prototype.updateMacro = function (macroId, macroData) {
            var _this3 = this;

            return $http.put('/_api/macros/' + macroId, macroData).then(function (res) {
                _this3.clearCache();
                return res.data;
            }).catch(function (res) {
                throw errorFactory.createResponseError(res);
            });
        };

        MacroService.prototype.deleteMacro = function (macroId) {
            return $http.delete('/_api/macros/' + macroId).then(function (res) {
                return res.data;
            }).catch(function (res) {
                throw errorFactory.createResponseError(res);
            });
        };

        MacroService.prototype.depopulateMacro = function (macro) {

            delete macro.createdBy;
            delete macro.updatedBy;
            delete macro.createdAt;
            delete macro.updatedAt;

            if (macro.template && macro.template._id) {
                macro.template = macro.template._id;
            }
            if (macro.parent && macro.parent._id) {
                macro.parent = macro.parent._id;
            }
            if (macro.basePage && macro.basePage._id) {
                macro.basePage = macro.basePage._id;
            }

            macro.includes = macro.includes.map(function (include) {
                if (include.plugin && include.plugin._id) {
                    include.plugin = include.plugin._id;
                }
                return include;
            });

            return macro;
        };

        MacroService.prototype.clearCache = function () {
            this.macroCache = null;
        };

        return new MacroService();
    });
})();
'use strict';

(function () {

    /**
     *
     * @type {*}
     */
    var adminApp = angular.module('adminApp');
    adminApp.controller('CompareController', function ($scope, $routeParams, $location, pageService, publishingService) {

        $scope.getStatusLabel = publishingService.getStatusLabel;

        var pageId = $routeParams.pageId;
        $scope.page = null;

        pageService.getPage(pageId).then(function (page) {
            $scope.page = page;
        });

        $scope.getPageUrl = function (preview) {
            return $scope.page.url + '?_preview=' + !!preview;
        };

        $scope.revertDraft = function () {
            var really = window.confirm('Really discard the draft changes of this page?');
            if (really) {
                publishingService.revertDraft($scope.page._id).then(function () {
                    $scope.showSuccess('The draft changes to ' + $scope.page.name + ' were discarded');
                    $location.path('/publishing');
                }).catch(function (err) {
                    $scope.showError('Error performing publish', err);
                });
            }
        };

        $scope.publish = function () {
            publishingService.publish([$scope.page._id]).then(function () {
                $scope.showSuccess('Publishing successful');
                $location.path('/publishing');
            }).catch(function (err) {
                $scope.showError('Error performing publish', err);
            });
        };
    });
})();
'use strict';

(function () {

    /**
     *
     * @type {*}
     */
    var adminApp = angular.module('adminApp');
    adminApp.controller('PublishingController', function ($scope, $rootScope, $routeParams, $window, $location, publishingService) {

        $scope.getStatusLabel = publishingService.getStatusLabel;

        var preQueued = $routeParams.pageId || null;

        $scope.drafts = [];

        //get all pages with drafts
        publishingService.getDrafts().then(function (drafts) {
            $scope.drafts = drafts;

            drafts.forEach(function (page) {
                if (page._id === preQueued) {
                    page.queued = true;
                }
            });
        }).catch(function (err) {
            $scope.showError('Error getting drafts to publish', err);
        });

        $scope.queueAll = function () {
            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError = undefined;

            try {
                for (var _iterator = $scope.drafts[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                    var page = _step.value;

                    $scope.queueToPublish(page, true);
                }
            } catch (err) {
                _didIteratorError = true;
                _iteratorError = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion && _iterator.return) {
                        _iterator.return();
                    }
                } finally {
                    if (_didIteratorError) {
                        throw _iteratorError;
                    }
                }
            }
        };
        $scope.unqueueAll = function () {
            var _iteratorNormalCompletion2 = true;
            var _didIteratorError2 = false;
            var _iteratorError2 = undefined;

            try {
                for (var _iterator2 = $scope.drafts[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                    var page = _step2.value;

                    $scope.queueToPublish(page, false);
                }
            } catch (err) {
                _didIteratorError2 = true;
                _iteratorError2 = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion2 && _iterator2.return) {
                        _iterator2.return();
                    }
                } finally {
                    if (_didIteratorError2) {
                        throw _iteratorError2;
                    }
                }
            }
        };

        $scope.queueToPublish = function (page, force) {
            page.queued = typeof force === 'boolean' ? force : !page.queued;
        };

        $scope.numQueued = function () {
            return $scope.drafts.reduce(function (prev, curr) {
                return curr.queued ? ++prev : prev;
            }, 0);
        };

        $scope.showCompare = function (page) {
            $location.path('/publishing/compare/' + page._id);
        };

        $scope.cancel = function () {
            $location.path('/pages');
        };

        $scope.publish = function () {
            var toPublishIds = $scope.drafts.filter(function (page) {
                return page.queued;
            }).map(function (page) {
                return page._id;
            });

            if (toPublishIds.length === 0) {
                $window.scrollTo(0, 0);
                $scope.submitted = true;
                return;
            }

            publishingService.publish(toPublishIds).then(function () {
                $scope.showSuccess('Publishing successful');
                $location.path('/');
            }).catch(function (err) {
                $scope.showError('Error performing publish', err);
            });
        };
    });
})();
'use strict';

(function () {
    var adminApp = angular.module('adminApp');
    adminApp.factory('publishingService', function ($http, pageService, errorFactory) {

        function PublishingService() {}
        PublishingService.prototype.getDrafts = function () {
            return pageService.getPages({
                draft: true
            });
        };

        PublishingService.prototype.publish = function (draftIds) {
            return $http.post('/_publish/pages', draftIds).then(function (res) {
                return res.data;
            }).catch(function (res) {
                throw errorFactory.createResponseError(res);
            });
        };

        PublishingService.prototype.revertDraft = function (pageId) {
            return $http.put('/_publish/revert', {
                pageId: pageId
            }).then(function (res) {
                return res.data;
            }).catch(function (res) {
                throw errorFactory.createResponseError(res);
            });
        };

        PublishingService.prototype.getStatusLabel = function (page) {
            if (page.published && page.status == 200) {
                return 'update';
            } else if (page.status == 404 || page.status == 410 && page.url != '/') {
                return 'delete';
            } else if (page.status == 301 || page.status == 302 || page.status == 307) {
                return 'redirect';
            } else if (!page.published && page.status == 200) {
                return 'new';
            } else {
                return page.status;
            }
        };

        return new PublishingService();
    });
})();
'use strict';

(function () {
    var adminApp = angular.module('adminApp');
    adminApp.factory('siteService', function ($http, errorFactory) {

        function SiteService() {}
        SiteService.prototype.getSite = function () {
            return $http.get('/_api/sites').then(function (res) {
                return res.data[0];
            }).catch(function (res) {
                throw errorFactory.createResponseError(res);
            });
        };

        SiteService.prototype.updateSite = function (siteId, siteData) {
            delete siteData._id;
            return $http.put('/_api/sites/' + siteId, siteData).then(function (res) {
                return res.data;
            }).catch(function (res) {
                throw errorFactory.createResponseError(res);
            });
        };

        return new SiteService();
    });
})();
'use strict';

(function () {

    /**
     *
     * @type {*}
     */
    var adminApp = angular.module('adminApp');
    adminApp.controller('SiteSettingsController', function ($scope, $rootScope, $location, $window, $q, pageService, siteService) {

        $scope.getPageHierarchyName = pageService.getPageHierarchyName;

        $scope.defaultPage = {
            redirect: ''
        };

        siteService.getSite().then(function (site) {
            $scope.site = site;
        });

        pageService.getPages().then(function (pages) {
            $scope.availablePages = pages.filter(function (page) {
                return page.status === 200 && page.parent !== null;
            });
            $scope.defaultPage = pages.filter(function (page) {
                return page.url === '/';
            })[0];
        });

        $scope.cancel = function () {
            $location.path('/');
        };

        $scope.save = function (form) {

            if (form.$invalid) {
                $window.scrollTo(0, 0);
                $scope.submitted = true;
                return;
            }
            var site = $scope.site;

            var promise = $q.when();
            if ($scope.defaultPage) {
                //get existing default pages (where url == /)
                promise = promise.then(function () {
                    return pageService.getPages({
                        url: '/'
                    });
                }).then(function (pages) {
                    var currentDefaultPage = pages && pages.length ? pages[0] : null;

                    var defaultPageData = {
                        name: 'Default page',
                        url: '/',
                        redirect: $scope.defaultPage.redirect,
                        status: 301
                    };

                    if (!currentDefaultPage && defaultPageData.redirect) {
                        //brand new default page
                        return pageService.createPage(defaultPageData);
                    } else if (currentDefaultPage && currentDefaultPage.status !== 200 && defaultPageData.redirect) {
                        //update an existing default page redirect
                        return pageService.updatePage(currentDefaultPage._id, defaultPageData);
                    } else if (currentDefaultPage && currentDefaultPage.status !== 200 && !defaultPageData.redirect) {
                        //delete the current default page if its a redirect
                        currentDefaultPage.status = 404;
                        currentDefaultPage.redirect = null;
                        return pageService.deletePage(currentDefaultPage);
                    } else {
                        //another page is using '/' as its url. Don't break it
                        var message = currentDefaultPage.name + ', is already the effective default page';
                        throw new Error(message);
                    }
                    //else the page has the url / explicitly set. leave it alone
                });
            }

            promise.then(function () {
                return siteService.updateSite(site._id, site);
            }).then(function () {
                $location.path('/');
            }).catch(function (err) {
                $scope.showError('Error updating site', err);
            });
        };
    });
})();
'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

(function () {
    var adminApp = angular.module('adminApp');
    adminApp.factory('pageService', function ($http, errorFactory) {

        function PageService() {
            this.pageCache = null;
        }
        PageService.prototype.getPages = function (filter) {
            var self = this;

            var queryKeyValPairs = [];
            if ((typeof filter === 'undefined' ? 'undefined' : _typeof(filter)) === 'object') {
                for (var key in filter) {
                    if (filter.hasOwnProperty(key)) {
                        queryKeyValPairs.push(encodeURIComponent(key) + '=' + encodeURIComponent(filter[key]));
                    }
                }
            } else if (this.pageCache) {
                //if no filter and the page cache is populated
                return Promise.resolve(this.pageCache);
            }

            var path = '/_api/pages';
            var url = queryKeyValPairs.length ? path + '?' + queryKeyValPairs.join('&') : path;
            return $http.get(url).then(function (res) {
                //if no filter was used cache
                if (!filter) {
                    self.pageCache = res.data;
                }
                return res.data;
            }).catch(function (res) {
                throw errorFactory.createResponseError(res);
            });
        };

        PageService.prototype.getAvailableTags = function () {
            return this.getPages().then(function (pages) {
                //combine all tags into one
                var seen = {};
                return pages.reduce(function (allTags, page) {
                    return allTags.concat(page.tags.filter(function (tag) {
                        return tag.text; //only return tags with text property
                    }));
                }, []).filter(function (tag) {
                    //remove dupes
                    return seen.hasOwnProperty(tag.text) ? false : seen[tag.text] = true;
                });
            });
        };

        PageService.prototype.getPage = function (pageId) {
            return $http.get('/_api/pages/' + pageId).then(function (res) {
                return res.data;
            }).catch(function (res) {
                throw errorFactory.createResponseError(res);
            });
        };

        PageService.prototype.createPage = function (pageData) {

            if (!pageData.url) {
                pageData.url = this.generateUrl(pageData);
            }
            this.pageCache = null;
            return $http.post('/_api/pages', pageData).then(function (res) {
                return res.data;
            }).catch(function (res) {
                throw errorFactory.createResponseError(res);
            });
        };

        /**
         * Deletes a page. If it is not published, its non-shared includes will also be deleted
         * @param page
         * @return {Promise|Promise.<T>|*}
         */
        PageService.prototype.deletePage = function (page) {
            var _this = this;

            this.pageCache = null;
            var promise;
            if (page.published) {
                var pageData = {
                    status: page.status || 404,
                    url: ''
                };

                pageData.redirect = page.redirect ? page.redirect._id : null;

                //live pages are updated to be gone
                promise = $http.put('/_api/pages/' + page._id, pageData);
            } else {
                //pages which have never been published can be hard deleted
                promise = $http.delete('/_api/pages/' + page._id).then(function () {
                    var deleteIncludePromises = [];
                    var _iteratorNormalCompletion = true;
                    var _didIteratorError = false;
                    var _iteratorError = undefined;

                    try {
                        var _loop = function _loop() {
                            var templateRegion = _step.value;

                            var pageRegion = page.regions.find(function (region) {
                                return region.name === templateRegion.name;
                            });
                            if (!templateRegion.sharing && pageRegion) {
                                var promises = pageRegion.includes.map(function (include) {
                                    return _this.deleteInclude(include._id);
                                });
                                deleteIncludePromises = deleteIncludePromises.concat(promises);
                            }
                        };

                        for (var _iterator = page.template.regions[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                            _loop();
                        }
                    } catch (err) {
                        _didIteratorError = true;
                        _iteratorError = err;
                    } finally {
                        try {
                            if (!_iteratorNormalCompletion && _iterator.return) {
                                _iterator.return();
                            }
                        } finally {
                            if (_didIteratorError) {
                                throw _iteratorError;
                            }
                        }
                    }

                    return Promise.all(deleteIncludePromises);
                });
            }
            return promise.then(function (res) {
                return res.data;
            }).catch(function (res) {
                throw errorFactory.createResponseError(res);
            });
        };

        PageService.prototype.deleteInclude = function (includeId) {
            return $http.delete('/_api/includes' + includeId).then(function (res) {
                return res.data;
            }).catch(function (res) {
                throw errorFactory.createResponseError(res);
            });
        };

        PageService.prototype.updatePage = function (pageId, pageData) {
            this.pageCache = null;
            return $http.put('/_api/pages/' + pageId, pageData).then(function (res) {
                return res.data;
            }).catch(function (res) {
                throw errorFactory.createResponseError(res);
            });
        };

        PageService.prototype.createIncludeData = function (plugin) {

            var includeData = {};

            var schemaProps = plugin.config.schema.properties || {};
            for (var name in schemaProps) {
                if (schemaProps.hasOwnProperty(name)) {
                    includeData[name] = typeof schemaProps[name].default !== 'undefined' ? schemaProps[name].default : null;
                }
            }

            return $http.post('/_api/includes', {
                data: includeData
            }).then(function (res) {
                return res.data;
            });
        };

        PageService.prototype.getRegionIndex = function (page, regionName) {
            //map region name to index
            var regionIndex = null;
            for (var i = 0; i < page.regions.length && regionIndex === null; i++) {
                if (page.regions[i].name === regionName) {
                    regionIndex = i;
                }
            }
            return regionIndex;
        };

        PageService.prototype.addRegion = function (page, regionName) {
            page.regions.push({
                name: regionName,
                includes: []
            });
            return page.regions.length - 1;
        };

        PageService.prototype.addIncludeToPage = function (page, regionIndex, plugin, include) {
            page.regions[regionIndex].includes.push({
                plugin: plugin,
                include: include._id
            });
        };

        PageService.prototype.moveInclude = function (page, regionName, fromIndex, toIndex) {
            //find the region
            var region = page.regions.filter(function (region) {
                return region.name === regionName;
            })[0];

            if (region) {
                var includeToMove = region.includes[fromIndex];
                region.includes.splice(fromIndex, 1);
                region.includes.splice(toIndex, 0, includeToMove);
            }
            return page;
        };

        PageService.prototype.generateUrl = function (page, parent) {

            parent = parent || page.parent;

            var parentUrlPart = null;
            if (parent && parent.url) {
                parentUrlPart = parent.url;
            }
            return (parentUrlPart || '') + '/' + slugify(page.name);
        };

        /**
         * Removes an include from a page model. Does not delete the actual include entity
         * @param page
         * @param regionIndex
         * @param includeIndex
         * @return {*}
         */
        PageService.prototype.removeInclude = function (page, regionIndex, includeIndex) {

            var i;
            //convert region name to index
            for (i = 0; i < page.regions.length && typeof regionIndex === 'string'; i++) {
                if (page.regions[i].name === regionIndex) {
                    regionIndex = i;
                }
            }

            //remove that index from the regions array
            if (typeof regionIndex === 'number') {
                for (i = page.regions[regionIndex].includes.length - 1; i >= 0; i--) {
                    if (i === includeIndex) {
                        page.regions[regionIndex].includes.splice(i, 1);
                    }
                }
            } else {
                var msg = 'Couldn\'t determine the region that the include to remove belongs to (' + regionIndex + ')';
                throw new Error(msg);
            }

            return page;
        };

        PageService.prototype.depopulatePage = function (page) {

            delete page.createdBy;
            delete page.updatedBy;
            delete page.createdAt;
            delete page.updatedAt;

            if (page.template && page.template._id) {
                page.template = page.template._id;
            }
            if (page.parent && page.parent._id) {
                page.parent = page.parent._id;
            }
            if (page.basePage && page.basePage._id) {
                page.basePage = page.basePage._id;
            }
            if (page.redirect && page.redirect._id) {
                page.redirect = page.redirect._id;
            }
            page.regions = page.regions.filter(function (region) {
                return (typeof region === 'undefined' ? 'undefined' : _typeof(region)) === 'object';
            }).map(function (region) {
                region.includes = region.includes.map(function (includeWrapper) {

                    if (includeWrapper.plugin && includeWrapper.plugin._id) {
                        includeWrapper.plugin = includeWrapper.plugin._id;
                    }
                    if (includeWrapper.include && includeWrapper.include._id) {
                        includeWrapper.include = includeWrapper.include._id;
                    }
                    return includeWrapper;
                });

                return region;
            });
            return page;
        };

        PageService.prototype.synchronizeWithBasePage = function (page) {
            function getRegionFromPage(page, regionName) {
                return page.regions.filter(function (region) {
                    return region.name === regionName;
                })[0] || null;
            }
            function containsInclude(region, includeToFind) {
                return region.includes.some(function (include) {
                    return include._id === includeToFind._id;
                });
            }
            //get basepage from id value
            var syncResults = [];
            page.template.regions.forEach(function (templateRegion) {
                var syncResult = {
                    region: templateRegion.name,
                    removedCount: 0,
                    sharedCount: 0
                };
                var sharing = !!templateRegion.sharing;
                var pageRegion = getRegionFromPage(page, templateRegion.name);
                if (!pageRegion) {
                    pageRegion = {
                        name: templateRegion.name,
                        includes: []
                    };
                    page.regions.push(pageRegion);
                }
                var baseRegion = getRegionFromPage(page.basePage, templateRegion.name);
                if (baseRegion) {
                    var startCount = pageRegion.includes ? pageRegion.includes.length : 0;
                    //add additional non-shared includes at the end
                    baseRegion.includes.forEach(function (baseInclude) {
                        if (sharing && !containsInclude(pageRegion, baseInclude)) {
                            pageRegion.includes.push(baseInclude);
                        }
                    });
                    syncResult.sharedCount = pageRegion.includes.length - startCount;
                }
                syncResults.push(syncResult);
            });

            return syncResults;
        };

        PageService.prototype.getPageHierarchyName = function (page) {
            var selectName = [];
            if (page.parent && page.parent.name) {
                if (page.parent.parent) {
                    selectName.push('...');
                }

                selectName.push(page.parent.name);
            }
            selectName.push(page.name);
            return selectName.join(' / ');
        };

        PageService.prototype.getOrderOfLastPage = function (parentPage) {
            var siblingsQuery = parentPage ? {
                parent: parentPage._id
            } : {
                root: 'top'
            };

            //get future siblings
            return this.getPages(siblingsQuery).then(function (pages) {
                if (pages.length === 0) {
                    return -1;
                }

                var pageOrders = pages.map(function (page) {
                    return page.order;
                });
                return Math.max.apply(null, pageOrders);
            });
        };

        return new PageService();
    });

    function slugify(str) {

        str = str || '';
        str = str.replace(/^\s+|\s+$/g, ''); // trim
        str = str.toLowerCase();

        // remove accents, swap ñ for n, etc
        var from = 'ãàáäâẽèéëêìíïîõòóöôùúüûñç·/_,:;';
        var to = 'aaaaaeeeeeiiiiooooouuuunc------';
        for (var i = 0, l = from.length; i < l; i++) {
            str = str.replace(new RegExp(from.charAt(i), 'g'), to.charAt(i));
        }

        str = str.replace(/[^a-z0-9 -]/g, '') // remove invalid chars
        .replace(/\s+/g, '-') // collapse whitespace and replace by -
        .replace(/-+/g, '-'); // collapse dashes

        return str;
    }
})();
'use strict';

(function () {

    /**
     *
     * @type {*}
     */
    var adminApp = angular.module('adminApp');
    adminApp.controller('SitemapController', function ($scope, $rootScope, $timeout, $location, siteService, pageService, $routeParams, macroService) {

        $rootScope.pageTitle = 'Sitemap';

        $scope.updateSearch = function (action) {
            $scope.viewMode = action;
            $location.path('/pages').search('action', action).replace();
        };

        $scope.macroAction = $routeParams.macroAction;
        $scope.viewMode = $location.search().action;
        if (!$scope.viewMode && !$scope.macroAction) {
            $scope.updateSearch('configure');
        }

        function getSite() {
            siteService.getSite().then(function (site) {
                $scope.site = site;
            }).catch(function (err) {
                $scope.showError('Error getting site', err);
            });
        }

        function getPages() {
            pageService.getPages().then(function (allPages) {
                var pageMap = {};
                allPages = allPages.filter(function (page) {
                    return page.status < 400;
                }).sort(function (a, b) {
                    if (a.order < b.order) {
                        return -1;
                    } else if (a.order > b.order) {
                        return 1;
                    } else {
                        return 0;
                    }
                });
                allPages.forEach(function (page) {
                    pageMap[page._id] = page;
                });

                var populateChildren = function populateChildren(pages) {
                    pages.forEach(function (currentPage) {
                        currentPage.children = allPages.filter(function (childCandidate) {
                            var candidateParentId = childCandidate.parent ? childCandidate.parent._id : null;
                            return currentPage._id === candidateParentId;
                        });
                        if (currentPage.children.length > 0) {
                            populateChildren(currentPage.children);
                        }
                    });
                };

                var primaryRoots = allPages.filter(function (page) {
                    return page.root === 'top';
                });
                populateChildren(primaryRoots);

                $scope.pages = primaryRoots;
            }).catch(function (err) {
                $scope.showError('Error getting pages', err);
            });
        }

        function getMacros() {
            macroService.getMacros().then(function (macros) {
                $scope.macros = macros;
            });
        }

        getSite();
        getPages();
        getMacros();

        $scope.addPage = function (parentPage) {
            $scope.showInfo('Preparing new page...');

            pageService.getOrderOfLastPage(parentPage).then(function (highestOrder) {
                var parentRoot = parentPage ? parentPage._id : 'root';
                highestOrder++;
                $location.path('/pages/new/' + encodeURIComponent(parentRoot) + '/' + encodeURIComponent(highestOrder));
            }).catch(function (msg) {
                $scope.showError('Unable to determine order of new page', msg);
            });
        };

        $scope.removePage = function (page) {

            if (page.published) {
                $location.path('/pages/delete/' + page._id);
            } else {
                var really = window.confirm('Really delete this page?');
                if (really) {
                    pageService.deletePage(page).then(function () {
                        window.location.reload();
                        $scope.showInfo('Page: ' + page.name + ' removed.');
                    }).catch(function (msg) {
                        $scope.showError('Error deleting page', msg);
                    });
                }
            }
        };

        $scope.movePage = function (page, direction) {

            var silbingQuery = {
                order: page.order + direction
            };
            if (page.parent) {
                silbingQuery.parent = page.parent._id;
            } else if (page.root) {
                silbingQuery.root = page.root;
            }

            pageService.getPages(silbingQuery).then(function (siblings) {

                var siblingPage = siblings[0];
                if (!siblingPage) {
                    //$scope.showInfo('Couldn\'t re-order pages');
                    return;
                }
                var promises = [];
                promises.push(pageService.updatePage(page._id, {
                    order: page.order + direction,
                    draft: true
                }));
                promises.push(pageService.updatePage(siblingPage._id, {
                    order: siblingPage.order - direction,
                    draft: true
                }));

                Promise.all(promises).then(function () {
                    getPages();
                }).catch(function (err) {
                    $scope.showError('Problem re-ordering pages', err);
                });
            });
        };

        $scope.moveBack = function (page) {
            $scope.movePage(page, -1);
        };
        $scope.moveForward = function (page) {
            $scope.movePage(page, 1);
        };
    });
})();
'use strict';

(function () {

    /**
     *
     * @type {*}
     */
    var adminApp = angular.module('adminApp');
    adminApp.controller('UserController', function ($scope, $rootScope, $log, $location, $routeParams, $window, userService) {
        $rootScope.pageTitle = 'User';

        var userId = $routeParams.userId;
        $scope.userId = userId;

        $scope.roles = [{
            name: 'editor',
            label: 'Editor'
        }, {
            name: 'developer',
            label: 'Developer'
        }, {
            name: 'admin',
            label: 'Admin'
        }];

        if (userId) {
            userService.getUser(userId).then(function (user) {
                $scope.user = user;
            });
        }

        $scope.cancel = function () {
            $location.path('/users');
        };

        $scope.save = function (form) {
            if (form.$invalid) {
                $window.scrollTo(0, 0);
                $scope.submitted = true;
                return;
            }
            var user = $scope.user;
            if (userId) {
                userService.updateUser(userId, user).then(function () {
                    $scope.showSuccess('User updated.');
                    $location.path('/users');
                }).catch(function (err) {
                    $scope.showError('Error updating user', err);
                });
            } else {
                userService.createUser(user).then(function () {
                    $scope.showSuccess('User created.');
                    $location.path('/users');
                }).catch(function (err) {
                    $scope.showError('Error creating user', err);
                });
            }
        };

        $scope.remove = function () {
            userService.deleteTemplate($scope.user._id).then(function () {
                $log.info('User removed');
                $location.path('/templates');
            }).catch(function (err) {
                $scope.showError('Error deleting template', err);
            });
        };
    });
})();
'use strict';

(function () {

    /**
     *
     * @type {*}
     */
    var adminApp = angular.module('adminApp');
    adminApp.controller('UserListController', function ($scope, $rootScope, $location, userService) {
        $rootScope.pageTitle = 'Users';

        userService.getUsers().then(function (users) {
            $scope.users = users;
        });
    });
})();
'use strict';

(function () {
    var adminApp = angular.module('adminApp');
    adminApp.factory('userService', function ($http, errorFactory) {

        function UserService() {}

        UserService.prototype.getUsers = function () {
            return $http.get('/_api/users').then(function (res) {
                return res.data;
            }).catch(function (res) {
                throw errorFactory.createResponseError(res);
            });
        };
        UserService.prototype.getUser = function (userId) {
            return $http.get('/_api/users/' + userId).then(function (res) {
                return res.data;
            }).catch(function (res) {
                throw errorFactory.createResponseError(res);
            });
        };

        UserService.prototype.createUser = function (userData) {
            return $http.post('/_api/users', userData).then(function (res) {
                return res.data;
            }).catch(function (res) {
                throw errorFactory.createResponseError(res);
            });
        };

        UserService.prototype.deleteUser = function (userId) {
            return $http.delete('/_api/users/' + userId).then(function (res) {
                return res.data;
            }).catch(function (res) {
                throw errorFactory.createResponseError(res);
            });
        };

        UserService.prototype.updateUser = function (userId, userData) {
            return $http.put('/_api/users/' + userId, userData).then(function (res) {
                return res.data;
            }).catch(function (res) {
                throw errorFactory.createResponseError(res);
            });
        };

        return new UserService();
    });
})();
'use strict';

(function () {

    /**
     *
     * @type {*}
     */
    var adminApp = angular.module('adminApp');
    adminApp.controller('TemplateController', function ($log, $scope, $rootScope, $routeParams, $location, $window, templateService) {
        $log.info('Showing Template View');

        var templateId = $routeParams.templateId;

        $scope.template = {
            properties: [],
            regions: [],
            regionData: []
        };

        templateService.getTemplateSources().then(function (templateSources) {
            $scope.templateSources = templateSources;
        });

        $scope.$watch('template.src', function (val) {
            if (val && !templateId) {
                $log.debug('Fetching regions for template src: %s...', val);
                $scope.scanRegions(val);
            }
        });

        if (templateId) {
            $scope.templateId = templateId;
            $log.debug('Fetching template data for id: %s...', templateId);
            templateService.getTemplate(templateId).then(function (template) {
                $log.debug('Got template data:\n', JSON.stringify(template, null, '\t'));
                $scope.template = template;
            }).catch(function (err) {
                $log.error(err, 'Error getting template');
                $scope.showError('Error getting template', err);
            });
        }

        $scope.addProperty = function () {
            $scope.template.properties.push({
                name: '',
                value: ''
            });
        };

        $scope.removeProperty = function (prop) {
            var index = $scope.template.properties.indexOf(prop);
            if (index > -1) {
                $scope.template.properties.splice(index, 1);
            }
        };

        $scope.scanRegions = function (templateSrc) {

            templateSrc = templateSrc || $scope.template.src;

            templateService.getTemplateRegions(templateSrc).then(function (newRegions) {
                $log.debug('Got regions: %s', newRegions);

                function isRegionNew(regionName) {
                    return !$scope.template.regions.some(function (region) {
                        return region.name === regionName;
                    });
                }

                newRegions.forEach(function (regionName) {
                    if (isRegionNew(regionName)) {
                        $scope.template.regions.push({
                            name: regionName,
                            includes: []
                        });
                    }
                });
            }).catch(function (err) {
                $scope.showError('Error getting template regions', err);
            });
        };

        $scope.cancel = function () {
            $location.path('/templates');
        };

        $scope.save = function (form) {
            if (form.$invalid) {
                $window.scrollTo(0, 0);
                $scope.submitted = true;
                return;
            }

            var template = $scope.template;

            //remove any empty properties
            for (var i = template.properties.length - 1; i >= 0; i--) {
                var prop = template.properties[i];
                if (!prop.name) {
                    template.properties.splice(i, 1);
                }
            }

            if (templateId) {
                $log.info('Updating template: %s...', templateId);
                $log.debug('with data:\n%s', JSON.stringify($scope.template, null, '\t'));
                templateService.updateTemplate(templateId, $scope.template).then(function () {
                    $log.info('Template updated successfully');
                    $scope.showSuccess('Template updated.');
                    $location.path('/templates');
                }).catch(function (err) {
                    $log.error(err, 'Error updating template');
                    $scope.showError('Error updating template', err);
                });
            } else {
                $log.info('Creating new template...');
                $log.debug('with data:\n%s', JSON.stringify($scope.template, null, '\t'));
                templateService.createTemplate($scope.template).then(function () {
                    $log.info('Template created successfully');
                    $scope.showSuccess('Template created.');
                    $location.path('/templates');
                }).catch(function (err) {
                    $log.error(err, 'Error creating template');
                    $scope.showError('Error creating template', err);
                });
            }
        };

        $scope.remove = function () {
            var really = window.confirm('Really delete this template?');
            if (really) {
                $log.info('Deleting template: %s...', $scope.template._id);
                templateService.deleteTemplate($scope.template._id).then(function () {
                    $log.info('Template deleted');
                    $location.path('/templates');
                }).error(function (err) {
                    $log.error(err, 'Could not delete template');
                    $scope.showError('Error deleting template', err);
                });
            }
        };

        $scope.duplicate = function () {

            $log.info('Duplicating template %s', $scope.template._id);

            var newTemplate = JSON.parse(JSON.stringify($scope.template));
            delete newTemplate._id;
            delete newTemplate.createdAt;
            delete newTemplate.createdBy;
            delete newTemplate.updatedAt;
            delete newTemplate.updatedBy;

            newTemplate.name = newTemplate.name + ' (copy)';
            templateService.createTemplate(newTemplate).then(function () {
                $log.info('Template duplicated successfully');
                $scope.showSuccess('Template duplicated.');
                $location.path('/templates');
            }).catch(function (err) {
                $log.error(err, 'Error duplicating template');
                $scope.showError('Error duplicating template', err);
            });
        };
    });
})();
'use strict';

(function () {

    /**
     *
     * @type {*}
     */
    var adminApp = angular.module('adminApp');
    adminApp.controller('TemplateListController', function ($scope, $rootScope, $routeParams, $location, templateService) {

        $rootScope.pageTitle = 'Templates';

        $scope.templates = [];

        templateService.doGetAvailableTemplates().then(function (templates) {
            $scope.templates = templates;
        }).catch(function (err) {
            $scope.showError('Error getting templates', err);
        });
    });
})();
'use strict';

(function () {
    var adminApp = angular.module('adminApp');
    adminApp.factory('templateService', function ($http, errorFactory) {

        function TemplateService() {}
        TemplateService.prototype.getTemplateSources = function () {
            return $http.get('/_templates/available').then(function (res) {
                return res.data;
            }).catch(function (res) {
                throw errorFactory.createResponseError(res);
            });
        };
        TemplateService.prototype.getTemplateRegions = function (templateSrc) {
            return $http.get('/_templates/template-regions', {
                params: {
                    templateSrc: templateSrc
                }
            }).then(function (res) {
                return res.data;
            }).catch(function (res) {
                throw errorFactory.createResponseError(res);
            });
        };
        TemplateService.prototype.doGetAvailableTemplates = function () {
            return $http.get('/_api/templates').then(function (res) {
                return res.data;
            }).catch(function (res) {
                throw errorFactory.createResponseError(res);
            });
        };
        TemplateService.prototype.getTemplate = function (templateId) {
            return $http.get('/_api/templates/' + templateId).then(function (res) {
                return res.data;
            }).catch(function (res) {
                throw errorFactory.createResponseError(res);
            });
        };
        TemplateService.prototype.createTemplate = function (templateData) {
            return $http.post('/_api/templates', templateData).then(function (res) {
                return res.data;
            }).catch(function (res) {
                throw errorFactory.createResponseError(res);
            });
        };

        TemplateService.prototype.updateTemplate = function (templateId, templateData) {
            return $http.put('/_api/templates/' + templateId, templateData).then(function (res) {
                return res.data;
            }).catch(function (res) {
                throw errorFactory.createResponseError(res);
            });
        };

        TemplateService.prototype.deleteTemplate = function (templateId) {
            return $http.delete('/_api/templates/' + templateId).then(function (res) {
                return res.data;
            }).catch(function (res) {
                throw errorFactory.createResponseError(res);
            });
        };

        return new TemplateService();
    });
})();
'use strict';

(function () {

    /**
     *
     * @type {*}
     */
    var adminApp = angular.module('adminApp');
    adminApp.controller('PluginController', function ($scope, $rootScope, $log, $routeParams, $location, $window, pluginService) {

        var pluginId = $routeParams.pluginId;

        //sets the code mirror mode for editing raw plugin data
        $scope.editorOpts = {
            mode: 'application/json'
        };

        $scope.plugin = {};

        if (pluginId) {
            $scope.pluginId = pluginId;
            pluginService.getPlugin(pluginId).then(function (plugin) {
                $scope.plugin = plugin;
            }).catch(function (err) {
                $scope.showError('Error getting plugin', err);
            });
        }

        $scope.reset = function () {
            pluginService.resetPlugin($scope.plugin).then(function () {
                $scope.showSuccess('Cache cleared');
            }).catch(function (err) {
                $scope.showError('Error getting plugin', err);
            });
        };

        $scope.cancel = function () {
            $location.path('/plugins');
        };

        $scope.save = function (form) {
            if (form.$invalid) {
                $scope.submitted = true;
                $window.scrollTo(0, 0);
                return;
            }

            if (pluginId) {
                pluginService.updatePlugin(pluginId, $scope.plugin).then(function () {
                    $log.info('Plugin saved');
                    $scope.showSuccess('Plugin updated.');
                    $location.path('/plugins');
                }).catch(function (err) {
                    $scope.showError('Error updating plugin', err);
                });
            } else {
                pluginService.createPlugin($scope.plugin).then(function () {
                    $log.info('Plugin created');
                    $scope.showSuccess('Plugin created.');
                    $location.path('/plugins');
                }).catch(function (err) {
                    $scope.showError('Error saving plugin', err);
                });
            }
        };

        $scope.remove = function () {
            var really = window.confirm('Really delete this plugin?');
            if (really) {
                pluginService.deletePlugin($scope.plugin._id).then(function () {
                    $scope.showInfo('Plugin deleted');
                    $location.path('/plugins');
                }).error(function (err) {
                    $scope.showError('Error deleting plugin', err);
                });
            }
        };
    });
})();
'use strict';

(function () {

    /**
     *
     * @type {*}
     */
    var adminApp = angular.module('adminApp');
    adminApp.controller('PluginListController', function ($scope, $rootScope, $routeParams, $location, pluginService) {

        $scope.plugins = [];

        pluginService.getPlugins().then(function (plugins) {
            $scope.plugins = plugins;
        }).catch(function (err) {
            $scope.showError('Error getting plugins', err);
        });
    });
})();
'use strict';

(function () {
    var adminApp = angular.module('adminApp');
    adminApp.factory('pluginService', function ($http, errorFactory) {

        function PluginService() {}
        PluginService.prototype.getPlugins = function () {
            return $http.get('/_api/plugins').then(function (res) {
                return res.data;
            }).catch(function (res) {
                throw errorFactory.createResponseError(res);
            });
        };
        PluginService.prototype.getPlugin = function (pluginId) {
            return $http.get('/_api/plugins/' + pluginId).then(function (res) {
                return res.data;
            }).catch(function (res) {
                throw errorFactory.createResponseError(res);
            });
        };

        PluginService.prototype.createPlugin = function (pluginData) {
            return $http.post('/_api/plugins', pluginData).then(function (res) {
                return res.data;
            }).catch(function (res) {
                throw errorFactory.createResponseError(res);
            });
        };

        PluginService.prototype.deletePlugin = function (pluginId) {
            return $http.delete('/_api/plugins/' + pluginId).then(function (res) {
                return res.data;
            }).catch(function (res) {
                throw errorFactory.createResponseError(res);
            });
        };

        PluginService.prototype.updatePlugin = function (pluginId, pluginData) {
            return $http.put('/_api/plugins/' + pluginId, pluginData).then(function (res) {
                return res.data;
            }).catch(function (res) {
                throw errorFactory.createResponseError(res);
            });
        };

        PluginService.prototype.resetPlugin = function (pluginData) {
            return $http.put('/_cache/plugins', {
                module: pluginData.module
            }).then(function (res) {
                return res.data;
            }).catch(function (res) {
                throw errorFactory.createResponseError(res);
            });
        };

        return new PluginService();
    });
})();
'use strict';

(function () {

    var adminApp = angular.module('adminApp');
    adminApp.directive('includeEditor', function () {
        return {
            scope: {
                page: '=',
                region: '=',
                onSave: '&'
            },
            template: '',
            link: function link(scope, element) {
                var page = scope.page;
                var regionName = scope.region;

                if (!page || !regionName) {
                    return;
                }
                var region = page.regions.find(function (region) {
                    return region.name === regionName;
                });
                if (region) {
                    var includeHolder = region.includes[0];
                    var pluginInterface = pagespace.getPluginInterface(includeHolder.plugin.name, page._id, includeHolder.include._id);
                    pluginInterface.close = function () {};
                    var iframe = document.createElement('iframe');
                    iframe.name = 'edit-incliude';
                    iframe.src = '/_static/plugins/' + includeHolder.plugin.name + '/edit.html';
                    iframe.width = '100%';
                    iframe.height = 'auto';
                    iframe.scrolling = 'no';
                    iframe.style.border = 'none';
                    iframe.style.marginTop = '1em';
                    element[0].appendChild(iframe);
                    iframe.contentWindow.window.pagespace = pluginInterface;

                    var iframeHeightUpdateInterval = setInterval(function () {
                        iframe.height = parseInt(iframe.contentWindow.document.body.clientHeight, 10) + 100;
                    }, 100);

                    scope.$on('$destroy', function () {
                        if (iframeHeightUpdateInterval) {
                            clearInterval(iframeHeightUpdateInterval);
                        }
                    });

                    scope.$on('save', function () {
                        pluginInterface.emit('save');
                    });
                }
            }
        };
    });
})();
'use strict';

(function () {

    /**
     *
     * @type {*}
     */
    var adminApp = angular.module('adminApp');
    adminApp.controller('PageMacroEditController', function ($scope, $rootScope, $timeout, $location, siteService, pageService, $routeParams, macroService, $log, $window) {

        $rootScope.pageTitle = 'Edit page content';

        var macroId = $routeParams.macroId;
        var pageId = $location.search().pageId;

        $scope.page = null;

        if (pageId) {
            $log.debug('Fetching page data for: %s', pageId);
            $scope.pageId = pageId;
            macroService.getMacro(macroId).then(function (macro) {
                $scope.macro = macro;
                return pageService.getPage(pageId);
            }).then(function (page) {
                $log.debug('Got page data OK.');
                $log.trace('...with data:\n', JSON.stringify(page, null, '\t'));
                $scope.page = page;

                //depopulate redirect page
                if (page.redirect) {
                    page.redirect = page.redirect._id;
                }
            });
        }

        $scope.cancel = function () {
            //roll back the newly created page
            if ($location.search().created === 'true' && $scope.page) {
                pageService.deletePage($scope.page).then(function () {
                    $location.path('/pages');
                }).catch(function (err) {
                    $log.error(err, 'Error rolling back page creation');
                    $scope.showError('Error rolling back page creation', err);
                });
            } else {
                $location.path('/pages');
            }
        };

        $scope.save = function (form) {
            if (form.$invalid) {
                $scope.submitted = true;
                $window.scrollTo(0, 0);
                return;
            }

            var page = $scope.page;

            $log.info('Page successfully updated');
            $scope.showSuccess('Page: ' + page.name + ' saved.');
            $scope.$broadcast('save');
            $timeout(function () {
                $location.path('/pages/macros/' + macroId + '/list');
            }, 200);
        };
    });
})();
'use strict';

(function () {

    /**
     *
     * @type {*}
     */
    var adminApp = angular.module('adminApp');
    adminApp.controller('PageListMacroController', function ($scope, $rootScope, $timeout, $location, siteService, pageService, $routeParams) {

        $rootScope.pageTitle = 'Pages';

        var macroId = $routeParams.macroId;

        $scope.pages = [];

        pageService.getPages({
            macro: macroId
        }).then(function (pages) {
            $scope.pages = pages;
        }).catch(function (err) {
            $scope.showError('Error getting pages', err);
        });

        $scope.edit = function (page) {
            $location.url('/pages/macros/' + macroId + '/edit?pageId=' + page._id);
        };

        $scope.publish = function (page) {
            $location.path('/publishing/' + page._id);
        };

        $scope.removePage = function (page) {

            if (page.published) {
                $location.path('/pages/delete/' + page._id);
            } else {
                var really = window.confirm('Really delete this page?');
                if (really) {
                    pageService.deletePage(page).then(function () {
                        window.location.reload();
                        $scope.showInfo('Page: ' + page.name + ' removed.');
                    }).catch(function (msg) {
                        $scope.showError('Error deleting page', msg);
                    });
                }
            }
        };
    });
})();
'use strict';

(function () {

    /**
     *
     * @type {*}
     */
    var adminApp = angular.module('adminApp');
    adminApp.controller('PageMacroNewController', function ($scope, $rootScope, $timeout, $location, siteService, pageService, $routeParams, macroService, $log, $window) {

        $rootScope.pageTitle = 'Page Macros';

        var macroId = $routeParams.macroId;
        $scope.page = {};

        macroService.getMacro(macroId).then(function (macro) {
            $scope.macro = macro;
            //$scope.page.root = 'top';
            $scope.page.parent = macro.parent;
            $scope.page.basePage = macro.basePage;
            $scope.page.template = macro.template;
            $scope.page.useInNav = !!macro.useInNav;
            $scope.page.macro = macro._id;
        });

        pageService.getAvailableTags().then(function (tags) {
            $scope.availableTags = tags;
        });

        $scope.updateUrl = function () {
            $scope.page.url = pageService.generateUrl($scope.page);
        };

        $scope.getMatchingTags = function (text) {
            text = text.toLowerCase();
            var tags = $scope.availableTags.filter(function (tag) {
                return tag.text && tag.text.toLowerCase().indexOf(text) > -1;
            });
            return Promise.resolve(tags);
        };

        $scope.cancel = function () {
            $location.path('/pages');
        };

        $scope.$watch('page.name', function () {
            if ($scope.pageForm && $scope.pageForm.url && $scope.pageForm.url.$pristine) {
                $scope.updateUrl();
            }
        });

        $scope.save = function (form) {
            if (form.$invalid) {
                $scope.submitted = true;
                $window.scrollTo(0, 0);
                return;
            }

            var page = $scope.page;
            var macro = $scope.macro;

            $log.info('Creating page...');
            $log.trace('...with data:\n%s', JSON.stringify(page, null, '\t'));

            //create regions based on template
            var pageRegions = [];
            page.template.regions.forEach(function (regionMeta) {
                var newRegion = {};
                newRegion.name = regionMeta.name;
                newRegion.includes = [];
                pageRegions.push(newRegion);
            });
            page.regions = pageRegions;

            if (page.basePage) {
                pageService.synchronizeWithBasePage(page);
            }

            //add a new page
            pageService.getOrderOfLastPage(page.parent).then(function (highestOrder) {
                page.order = ++highestOrder;
                page = pageService.depopulatePage(page);
                return pageService.createPage(page);
            }).then(function (createdPage) {
                $log.info('Page successfully created');
                page = createdPage;
                //for each macro include create
                var includeCreationPromises = macro.includes.map(function (includeMeta) {
                    return pageService.createIncludeData(includeMeta.plugin);
                });
                return Promise.all(includeCreationPromises);
            }).then(function (includesData) {
                //add the newly created includes to the new page
                includesData.forEach(function (includeData, i) {
                    var regionIndex = pageService.getRegionIndex(page, macro.includes[i].region);
                    pageService.addIncludeToPage(page, regionIndex, macro.includes[i].plugin, includeData);
                });
                //save
                page = pageService.depopulatePage(page);
                pageService.updatePage(page._id, page);
                $location.url('/pages/macros/' + macroId + '/edit?pageId=' + page._id + '&created=true');
            }).catch(function (err) {
                $log.error(err, 'Error creating page');
                $scope.showError('Error adding new page', err);
            });
        };
    });
})();
'use strict';

(function () {

    /**
     *
     * @type {*}
     */
    var adminApp = angular.module('adminApp');
    adminApp.controller('DeletePageController', function ($scope, $rootScope, $routeParams, $location, $timeout, pageService, $window) {

        var pageId = $routeParams.pageId;
        $scope.status = 410;

        pageService.getPage(pageId).then(function (page) {
            $scope.page = page;

            //default delete status
            page.status = 410;
        }).catch(function (err) {
            $scope.showError('Couldn\'t find a page to delete', err);
        });
        pageService.getPages().then(function (pages) {
            $scope.pages = pages;
        }).catch(function (err) {
            $scope.showError('Couldn\'t get pages', err);
        });

        $scope.cancel = function () {
            $location.path('');
        };

        $scope.submit = function (form) {

            if (form.$invalid) {
                $scope.submitted = true;
                $window.scrollTo(0, 0);
                return;
            }

            var page = $scope.page;

            pageService.deletePage(page).then(function () {
                $location.path('');
                $scope.showInfo('Page: ' + page.name + ' removed.');
            }).catch(function (err) {
                $scope.showError('Error deleting page', err);
            });
        };
    });
})();
'use strict';

(function () {

    /**
     *
     * @type {*}
     */
    var adminApp = angular.module('adminApp');
    adminApp.controller('PageController', function ($log, $scope, $rootScope, $routeParams, $location, $timeout, pageService, templateService, pluginService, $window) {

        $log.info('Showing page view.');

        $scope.getPageHierarchyName = pageService.getPageHierarchyName;

        $scope.section = $routeParams.section || 'basic';

        $scope.clearNotification();

        var pageId = $routeParams.pageId;

        var parentPageId = $routeParams.parentPageId;
        var order = $routeParams.order;

        $scope.allPages = [];
        pageService.getPages().then(function (pages) {
            $scope.allPages = pages;
        }).catch(function (err) {
            $scope.showError('Couldn\'t get all pages', err);
        });

        var pageSetupPromises = [];
        pageSetupPromises.push(templateService.doGetAvailableTemplates().then(function (templates) {
            $log.info('Got available templates.');
            $scope.templates = templates;
        }));
        pageSetupPromises.push(pluginService.getPlugins().then(function (availablePlugins) {
            $log.debug('Got available plugins.');
            $scope.availablePlugins = availablePlugins;
        }));

        if (pageId) {
            $log.debug('Fetching page data for: %s', pageId);
            $scope.pageId = pageId;
            pageSetupPromises.push(pageService.getPage(pageId).then(function (page) {
                $log.debug('Got page data OK.');
                $log.trace('...with data:\n', JSON.stringify(page, null, '\t'));
                $scope.page = page;

                if (page.expiresAt) {
                    page.expiresAt = new Date(page.expiresAt);
                }
                if (page.publishedAt) {
                    page.publishedAt = new Date(page.publishedAt);
                }

                //depopulate redirect page
                if (page.redirect) {
                    page.redirect = page.redirect._id;
                }
            }));
        } else {
            $scope.page = {
                regions: [],
                useInNav: true
            };
            if (parentPageId) {
                pageSetupPromises.push(pageService.getPage(parentPageId).then(function (page) {
                    $scope.page.parent = page;
                }));
            } else {
                $scope.page.root = 'top';
            }
        }

        Promise.all(pageSetupPromises).then(function () {
            //if there's only one template choose it automatically
            if (!$scope.page.template && $scope.templates.length === 1) {
                $scope.page.template = $scope.templates[0];
            }
        }).catch(function (err) {
            $scope.showError(err);
        });

        $scope.updateUrl = function () {
            $scope.page.url = pageService.generateUrl($scope.page);
        };

        pageService.getAvailableTags().then(function (tags) {
            $scope.availableTags = tags;
        });

        $scope.getMatchingTags = function (text) {
            text = text.toLowerCase();
            var tags = $scope.availableTags.filter(function (tag) {
                return tag.text && tag.text.toLowerCase().indexOf(text) > -1;
            });
            return Promise.resolve(tags);
        };

        $scope.cancel = function () {
            $location.path('/pages');
        };

        $scope.$watch('page.name', function () {
            if (!pageId && $scope.pageForm && $scope.pageForm.url && $scope.pageForm.url.$pristine) {
                $scope.updateUrl();
            }
        });

        $scope.$watch('page.status', function (status) {
            status = parseInt(status, 10);
            if ($scope.page && status !== 301 && status !== 302) {
                $scope.page.redirect = null;
            }
        });

        $scope.syncResults = null;

        $scope.synchronizeWithBasePage = function (page) {
            $scope.syncResults = pageService.synchronizeWithBasePage(page);
        };

        $scope.save = function (form) {
            if (form.$invalid) {
                $scope.submitted = true;
                $window.scrollTo(0, 0);
                return;
            }

            var page = $scope.page;
            if (order) {
                page.order = order;
            }

            if (pageId) {
                $log.info('Update page: %s...', pageId);
                $log.trace('...with data:\n%s', JSON.stringify(page, null, '\t'));
                page = pageService.depopulatePage(page);
                pageService.updatePage(pageId, page).then(function () {
                    $log.info('Page successfully updated');
                    $scope.showSuccess('Page: ' + page.name + ' saved.');
                    $location.path('');
                }).catch(function (err) {
                    $log.error(err, 'Error updating page');
                    $scope.showError('Error updating page', err);
                });
            } else {
                $log.info('Creating page...');
                $log.trace('...with data:\n%s', JSON.stringify(page, null, '\t'));

                //create regions based on template
                var pageRegions = [];
                page.template.regions.forEach(function (regionMeta) {
                    var newRegion = {};
                    newRegion.name = regionMeta.name;
                    newRegion.includes = [];
                    pageRegions.push(newRegion);
                });
                page.regions = pageRegions;

                if (page.basePage) {
                    pageService.synchronizeWithBasePage(page);
                }

                page = pageService.depopulatePage(page);
                pageService.createPage(page).then(function (page) {
                    $log.info('Page successfully created');
                    $scope.showSuccess('Page: ' + page.name + ' created.');
                    $location.path('');
                }).catch(function (err) {
                    $log.error(err, 'Error creating page');
                    $scope.showError('Error adding new page', err);
                });
            }
        };
    });
})();
'use strict';

(function () {

    var adminApp = angular.module('adminApp');
    adminApp.directive('pageHolder', function () {
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
                element.css('height', getWindowHeight() - element[0].offsetTop - 5 + 'px');

                window.addEventListener('resize', function () {
                    element.css('height', getWindowHeight() - element[0].offsetTop - 5 + 'px');
                });

                var pageFrame = element.find('iframe')[0];
                pageFrame.addEventListener('load', function () {

                    //injection
                    var adminStyles = document.createElement('link');
                    adminStyles.setAttribute('type', 'text/css');
                    adminStyles.setAttribute('rel', 'stylesheet');
                    adminStyles.setAttribute('href', '/_static/inpage/inpage-edit.css');

                    var pluginInterfaceScript = document.createElement('script');
                    pluginInterfaceScript.src = '/_static/inpage/plugin-interface.js';

                    var adminScript = document.createElement('script');
                    adminScript.src = '/_static/inpage/inpage-edit.js';

                    adminScript.onload = function () {
                        window.setTimeout(function () {
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
'use strict';

(function () {

    /**
     *
     * @type {*}
     */
    var adminApp = angular.module('adminApp');
    adminApp.controller('ViewJsonController', function ($scope, $rootScope, $routeParams) {

        var url = $routeParams.url;

        $scope.getPageUrl = function () {
            return '/_api/' + url;
        };
    });

    adminApp.directive('jsonHolder', function () {
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
                element.css('height', getWindowHeight() - element[0].offsetTop - 5 + 'px');

                window.addEventListener('resize', function () {
                    element.css('height', getWindowHeight() - element[0].offsetTop - 5 + 'px');
                });
            }
        };
    });
})();
'use strict';

(function () {

    var adminApp = angular.module('adminApp');
    adminApp.controller('ViewPageController', function ($scope, $rootScope, $routeParams) {

        var env = $routeParams.viewPageEnv;
        var url = $routeParams.url;

        $scope.getPageUrl = function () {
            var showPreview = env === 'preview';
            return '/' + (url || '') + '?_preview=' + showPreview;
        };
    });
})();