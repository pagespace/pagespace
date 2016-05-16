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

(function() {
    var adminApp = angular.module('adminApp');
    adminApp.directive('bsHasError', function() {
        return {
            restrict: 'A',
            link: function(scope, element, attrs) {
                //find parent form
                function getClosestFormName(element) {
                    var parent = element.parent();
                    if(parent[0].tagName.toLowerCase() === 'form') {
                        return parent.attr('name') || null;
                    } else {
                        return getClosestFormName(parent);
                    }
                }
                var formName = getClosestFormName(element);
                var fieldName = attrs.bsHasError;

                if(formName && fieldName) {
                    var field = scope[formName][fieldName];
                    if(field) {
                        scope.$watch(function() {
                            element.toggleClass('has-error', field.$invalid && (field.$dirty || !!scope.submitted));
                            element.toggleClass('has-success', field.$valid && field.$dirty);
                        });
                    }
                }
            }
        };
    });
})();


(function() {
    var adminApp = angular.module('adminApp');
    adminApp.directive('psFieldMatch', function() {
        return {
            require: 'ngModel',
            link: function (scope, element, attrs, model) {

                function getClosestFormName(element) {
                    var parent = element.parent();
                    if(parent[0].tagName.toLowerCase() === 'form') {
                        return parent.attr('name') || null;
                    } else {
                        return getClosestFormName(parent);
                    }
                }
                var formName = getClosestFormName(element);
                var fieldName = attrs.psFieldMatch;
                if(formName && fieldName) {
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


(function() {

    var adminApp = angular.module('adminApp');
    adminApp.controller('AddIncludeController', function($log, $scope, $routeParams, $q, pageService, pluginService) {

        var pageId = $routeParams.pageId;
        var regionName = $routeParams.region;

        $scope.added = false;
        $scope.selectedPlugin = null;

        var pluginsPromise = pluginService.getPlugins();
        var pagePromise = pageService.getPage(pageId);

        $q.all([pluginsPromise, pagePromise ]).then(function(results) {
            $scope.availablePlugins = results[0].data;
            $scope.page = results[1].data;

            $log.debug('Got available plugins and page ok');
        }).catch(function(err) {
            $scope.err = err;
            $log.error(err, 'Unable to get data');
        });

        $scope.selectPlugin = function(plugin) {
            $scope.selectedPlugin = plugin;
        };

        $scope.addInclude = function() {

            //map region name to index
            var regionIndex = null;
            for(var i = 0; i < $scope.page.regions.length && regionIndex === null; i++) {
                if($scope.page.regions[i].name === regionName) {
                    regionIndex = i;
                }
            }

            //add a new region
            if(regionIndex === null) {
                $scope.page.regions.push({
                    name: regionName,
                    includes: []
                });
                regionIndex = $scope.page.regions.length - 1;
            }

            //add the new include to the region
            if($scope.selectedPlugin) {
                pageService.createIncludeData($scope.selectedPlugin.config).then(function(res) {
                    return res.data;
                }).then(function(includeData) {
                    $scope.page.regions[regionIndex].includes.push({
                        plugin: $scope.selectedPlugin,
                        include: includeData._id
                    });
                    $scope.page = pageService.depopulatePage($scope.page);
                    return pageService.updatePage(pageId, $scope.page);
                }).then(function() {
                    $scope.added = true;
                }).catch(function(err) {
                    $log.error(err, 'Update page to add include failed (pageId=%s, region=%s)', pageId, regionIndex);
                });
            } else {
                $log.error('Unable to determine region index for new include (pageId=%s, region=%s)',
                    pageId, regionName);
            }
        };

        $scope.close = function() {
            window.parent.parent.location.reload();
        };
    });
})();
(function() {

    var adminApp = angular.module('adminApp');

    adminApp.directive('removeIncludeDrop', function() {
        return {
            replace: true,
            transclude: true,
            template: '<div ng-transclude class="remove-include-drop"></div>',
            link: function link(scope, element) {

                var dragCounter = 0;
                element[0].addEventListener('dragenter', function(ev) {
                    if(containsType(ev.dataTransfer.types, 'include-info')) {
                        dragCounter++;
                        this.classList.add('drag-over');
                        ev.preventDefault();
                    }
                });
                element[0].addEventListener('dragover', function(ev) {
                    if(containsType(ev.dataTransfer.types, 'include-info')) {
                        ev.dataTransfer.dropEffect = 'move';
                        ev.preventDefault();
                    }
                });
                element[0].addEventListener('dragleave', function(ev) {
                    if(containsType(ev.dataTransfer.types, 'include-info')) {
                        dragCounter--;
                        if(dragCounter === 0) {
                            this.classList.remove('drag-over');
                            ev.preventDefault();
                        }
                    }
                });
                element[0].addEventListener('drop', function(ev) {
                    if(containsType(ev.dataTransfer.types, 'include-info')) {
                        var data = ev.dataTransfer.getData('include-info');
                        data = JSON.parse(data);
                        var pageId = data.pageId;
                        var regionName = data.region;
                        var includeIndex =  parseInt(data.includeIndex);
                        scope.remove(pageId, regionName, includeIndex);
                        ev.preventDefault();
                    }
                });

                function containsType(list, value) {
                    for( var i = 0; i < list.length; ++i ) {
                        if(list[i] === value) {
                            return true;
                        }
                    }
                    return false;
                }
            },
            controller: function($log, $scope, pageService) {
                $scope.remove = function(pageId, regionName, includeIndex) {
                    pageService.getPage(pageId).success(function(page) {
                        page = pageService.removeInclude(page, regionName, includeIndex);
                        page = pageService.depopulatePage(page);
                        pageService.updatePage(pageId, page).success(function() {
                            $log.info('Include removed for pageId=%s, region=%s, include=%s',
                                pageId, regionName, includeIndex);
                            window.location.reload();
                        }).error(function(err) {
                            $scope.err = err;
                            $log.error(err, 'Update page to remove include failed (pageId=%s, region=%s, include=%s',
                                pageId, regionName, includeIndex);
                        });
                    }).error(function(err) {
                        $scope.err = err;
                        $log.error(err, 'Unable to get page: %s', pageId);
                    });
                };
            }
        };
    });
})();
(function() {

    /**
     *
     * @type {*}
     */
    var adminApp = angular.module('adminApp');
    adminApp.controller('MacrosController', function($scope, $rootScope) {
        $rootScope.pageTitle = 'Macros';
    });

})();

(function() {

/**
 *
 * @type {*}
 */
var adminApp = angular.module('adminApp');
adminApp.controller('MediaController', function($scope, $rootScope, $location, $window, $q, mediaService) {
    $rootScope.pageTitle = 'Media';

    $scope.mediaItems = [];
    $scope.filteredItems = [];
    $scope.availableTags = [];
    $scope.selectedTags = [];

    $scope.getTypeShortName = mediaService.getTypeShortName;
    $scope.getSrcPath = mediaService.getSrcPath;

    $scope.toggleEditing = function (item) {
        item._editing = !item._editing
    };

    $scope.setItems = function (items) {
        $scope.mediaItems = items;
    };
    
    $scope.getItems = function() {
        mediaService.getItems().success(function(items) {
            $scope.setItems(items);
            $scope.updateFilter();

            //combine all tags into one
            var availableTags = items.reduce(function(allTags, item) {
                return allTags.concat(item.tags.filter(function(tag) {
                    return tag.text; //only return tags with text property
                }));
            }, []);

            //remove dups
            var seen = {};
            availableTags = availableTags.filter(function(tag) {
                return seen.hasOwnProperty(tag.text) ? false : (seen[tag.text] = true);
            });
            $scope.availableTags = availableTags;
        }).error(function(err) {
            $scope.showError('Error getting media items', err);
        });
    };

    $scope.getMatchingTags = function(text) {
        text = text.toLowerCase();
        return $q(function(resolve) {
            resolve($scope.availableTags.filter(function(tag) {
                return tag.text && tag.text.toLowerCase().indexOf(text) > -1;
            }));
        });
    };

    $scope.toggleTag = function(tag) {
        if(tag.on) {
            deselectTag(tag);
        } else {
            selectTag(tag);
        }
    };
    
    $scope.addTag = function(tag) {
        if($scope.availableTags.indexOf(tag) < 0) {
            $scope.availableTags.push(tag);
        }    
    };

    function selectTag(newTag) {
        newTag.on = true;
        var alreadyExists = $scope.selectedTags.some(function(tag) {
            return newTag.text === tag.text;
        });
        if(!alreadyExists) {
            $scope.selectedTags.push(newTag);
        }
        $scope.updateFilter();
    }

    function deselectTag(oldTag) {
        oldTag.on = false;
        $scope.selectedTags = $scope.selectedTags.filter(function(tag) {
            return oldTag.text !== tag.text;
        });
        $scope.updateFilter();
    }

    $scope.updateFilter = function() {

        if($scope.selectedTags.length === 0) {
            $scope.filteredItems = $scope.mediaItems;
            return;
        }

        $scope.filteredItems = $scope.mediaItems.filter(function(item) {
            return item.tags.some(function(tag) {
                return $scope.selectedTags.some(function(selectedTag) {
                    return selectedTag.text === tag.text;
                });
            });
        });
    }
    
   
});

})();

(function() {
    
    var tmpl =
        `
         <div class="list-group col-sm-11">
            <h3>Media library</h3>
             <div ng-repeat="item in filteredItems" class="media-item list-group-item">    
                <div class="media-item-part clearfix">
                    <div class="media-item-preview pull-left" style="cursor: pointer;">
                        <img ng-src="{{getSrcPath(item, 'thumb', '/_static/dashboard/styles/types/file.png')}}" 
                             ng-click="!item._editing ? showItem(item) : ''" 
                             alt="{{item.name}}" title="{{item.type}}">
                        <span class="item-type" ng-if="!isImage(item)">{{getTypeShortName(item)}}</span>
                    </div>  
                    <div class="btn-group pull-right">
                        <button type="button" class="btn btn-default" title="Cancel"
                                ng-show="item._editing" ng-click="revertItem(item)">
                            <span class="glyphicon glyphicon glyphicon-remove"></span>
                        </button>
                        <button type="button" class="btn btn-primary" title="Update"
                                ng-show="item._editing" ng-click="updateItem(item)">                                
                            <span class="glyphicon glyphicon glyphicon-ok"></span>
                        </button>
                        
                        <button type="button" class="btn btn-default" title="Edit" 
                                ng-show="!item._editing" ng-click="item._editing = !item._editing">
                            <span class="glyphicon glyphicon-pencil"></span>
                        </button>      
                        <button type="button" class="btn btn-default" title="Delete" 
                                ng-show="!item._editing" ng-click="deleteItem(item)">
                            <span class="glyphicon glyphicon-trash"></span>
                        </button> 
                    </div>     
                    <div ng-if="!item._editing" class="media-item-view"> 
                        <h3>{{item.name}}</h3>
                        <p><span class="label label-primary" ng-repeat="tag in item.tags">{{tag.text}}</span></p>       
                        <p><small><a href="/_media/{{item.fileName}}" target="_blank">/_media/{{item.fileName}}</a></small></p>                                         
                    </div>
                    <div ng-if="item._editing" class="media-item-edit">
                        <input placeholder="Name" ng-model="item.name" required class="form-control">
                        <tags-input ng-model="item.tags" on-tag-added="addTag($tag)" placeholder="Add tags to help manage your files">
                            <auto-complete source="getMatchingTags($query)"></auto-complete>
                        </tags-input>         
                    </div>   
                </div>                                                          
            </div>
            <p ng-if="!mediaItems.length">The media library is empty</p>
            <p ng-if="mediaItems.length && !filteredItems.length">No items match this filter</p>
        </div>`;
    
    var adminApp = angular.module('adminApp');
    adminApp.directive('mediaItems', function() {
        return {
            scope: true,
            template: tmpl,
            link: function link(scope, element, mediaService) {

                //  scope.isImage = mediaService.isImage;
            },
            controller: function($log, $scope, $location, mediaService) {
                
                $scope.isImage = mediaService.isImage;
                $scope.getMimeClass = mediaService.getMimeClass;

                $scope.getItems();

                $scope.showItem = function(item) {
                    $location.path('/media/' + item._id);
                };

                $scope.deleteItem = function(item) {
                    var really = window.confirm('Really delete the item, ' + item.name + '?');
                    if(really) {
                        mediaService.deleteItem(item.fileName).success(function() {
                            $scope.getItems();
                            $scope.showInfo('Media: ' + item.name + ' removed.');
                        }).error(function(err) {
                            $scope.showError('Error deleting page', err);
                        });
                    }
                };

                $scope.revertItem = function (item) {
                    mediaService.getItem(item._id).success(function(itemFromServer) {
                        item.name = itemFromServer.name;
                        item.tags = itemFromServer.tags;
                        item._editing = false;
                    }).error(function(err) {
                        $scope.showError('Error reverting item', err);
                    });
                };

                $scope.updateItem = function (item) {
                    mediaService.updateItem(item._id, item).success(function() {
                        item._editing = false;
                    }).error(function(err) {
                        $scope.showError('Error udpdating item', err);
                    });
                }


            }
        };
    });

})();
(function() {
    var adminApp = angular.module('adminApp');
    adminApp.factory('mediaService', function($http, $log) {
        
        var mimeTypeShortNames = {
            "audio/basic" : "audio",
            "video/msvideo" : "video",
            "video/avi" : "video",
            "image/bmp" : "bitmap",
            "text/css" : "css",
            "application/msword" : "word",
            "image/gif" : "gif",
            "application/x-gzip" : "gzip",
            "text/html" : "html",
            "image/jpeg" : "jpeg",
            "application/x-javascript":  "js",
            "audio/x-midi" : "midi",
            "video/mpeg" : "video",
            "audio/vorbis" : "ogg",
            "application/ogg" : "ogg",
            "application/pdf" : "pdf",
            "image/png" : "png",
            "application/vnd.openxmlformats-officedocument.presentationml.presentation" : "ppt",
            "video/quicktime" : "qt",
            "image/svg+xml" : "svg",
            "application/x-shockwave-flash" : "flash",
            "application/x-tar" : "tar",
            "image/tiff" : "tar",
            "text/plain" : "text",
            "audio/wav, audio/x-wav" : "wav",
            "application/vnd.ms-excel" : "excel",
            "application/xml" : "xml",
            "application/zip" : "zip"
        }

        function MediaService() {
        }

        MediaService.prototype.getItems = function() {
            return $http.get('/_api/media');
        };

        MediaService.prototype.getItem = function(mediaId) {
            return $http.get('/_api/media/' + mediaId);
        };

        MediaService.prototype.updateItem = function(mediaId, mediaData) {
            return $http.put('/_api/media' + mediaId, mediaData);
        };

        MediaService.prototype.updateItemText = function(mediaData, content) {
            return $http.put('/_media/' + mediaData.fileName, {
                content: content
            });
        };

        MediaService.prototype.deleteItem = function(fileName) {
            return $http.delete('/_media/' + fileName);
        };

        MediaService.prototype.uploadItem = function(formData) {
            //store upload in session, then accept media data
            return $http.post('/_media', formData, {
                withCredentials: true,
                headers: { 'Content-Type': undefined },
                transformRequest: angular.identity
            });
        };

        MediaService.prototype.getItemText = function(item) {
            return $http.get('/_media/' + item.fileName);
        };

        MediaService.prototype.getImageVariations = function() {
            return $http.get('/_dashboard/settings').then(function(res) {
                var settings = res.data;
                return settings.imageVariations || [];
            });
        };

        //some utils
        MediaService.prototype.isImage = function(item) {
            return item && item.type && !!item.type.match(/^image/);
        };
        MediaService.prototype.isText = function(item) {
            return item && item.type && !!item.type.match(/text\/[plain|json|html]/);
        };
        MediaService.prototype.isDocument = function(item) {
            return item && item.type && !!item.type.match(/application\/pdf/);
        };

        MediaService.prototype.getMimeClass = function(item) {
            return 'media-' + item.type.split('/')[1];
        };

        MediaService.prototype.getSrcPath = function(item, label, fallback) {
            var src = null;

            if(this.isImage(item)) {
                if(item.fileSrc) {
                    src = item.fileSrc;
                } else if(item.fileName) {
                    src = '/_media/' + item.fileName;
                    if(label) {
                        src += '?label=' + label;
                    }
                }
            } else {
                src = fallback;
            }
            
            return src;
        };

        MediaService.prototype.getTypeShortName = function(item) {
            
            if(mimeTypeShortNames[item.type]) {
                return mimeTypeShortNames[item.type];
            }
            
            try {
                return item.fileName.split('\.')[1].toLowerCase();
            } catch(err) {
                $log.warn(err);
                return '???'
            }
        };

        /* jshint ignore:start */
        //thanks http://stackoverflow.com/a/14919494/200113
        MediaService.prototype.humanFileSize = function(bytes) {
            var exp = Math.log(bytes) / Math.log(1024) | 0;
            var result = (bytes / Math.pow(1024, exp)).toFixed(2);

            return result + ' ' + (exp == 0 ? 'bytes': 'KMGTPEZY'[exp - 1] + 'B');
        };
        /* jshint ignore:end */

        return new MediaService();
    });

})();




(function() {
    
    var tmpl =
        `<div class="list-group col-sm-11">
            <div class="media-item list-group-item media-file-select" ng-click="selectFiles()">
                <div class="media-item-part clearfix">
                    <input type="file" multiple="true" class="ng-hide">
                    <h3><span class="add-icon">+</span> 
                        <span class="add-text">Add files to library</span>
                        <span class="drop-text">Drop to add files</span>
                    </h3>
                </div>
            </div>
        </div> 

        <form ng-if="files.length > 0" ng-submit="upload(uploadForm)" name="uploadForm" 
              class="form-horizontal media-upload-form" novalidate>
            <div class="list-group col-sm-11">           
                <h3>Prepare media to add</h3>
                <div ng-repeat="file in files" ng-click="showItem(item)" class="media-item list-group-item">   
                        <div class="media-item-part clearfix">
                            <div class="media-item-preview pull-left">
                                <img ng-src="{{getSrcPath(file.item, null, '/_static/dashboard/styles/types/file.png')}}" 
                                     alt="{{file.item.name}}" title="{{file.item.type}}">
                                <span class="item-type" ng-if="!isImage(file.item)">{{getTypeShortName(file.item)}}</span>
                            </div>   
                            <div class="btn-group pull-right">
                                <button type="button" class="btn btn-default" ng-click="remove(file)" title="Remove">
                                    <span class="glyphicon glyphicon-trash"></span>
                                </button>      
                            </div>
                            <div class="media-item-edit">
                                <input placeholder="Name" ng-model="file.item.name" required class="form-control">   
                                <tags-input ng-model="file.item.tags" on-tag-added="addTag($tag)" 
                                            placeholder="Add tags to help manage your files">
                                    <auto-complete source="getMatchingTags($query)"></auto-complete>
                                </tags-input>     
                                <p style="margin-top: 1em"><small>/_media/{{file.name}}</small></p>   
                            </div>                 
                        </div>
                    </div>
                </div>                              
            </div>
            <div class="action-buttons col-sm-11">
                <button type="submit" class="btn btn-primary">                    
                    <ng-pluralize count="files.length"
                                  when="{'one': 'Add file', 'other': 'Add {} files'}">
                    </ng-pluralize>
                </button>
                <button ng-click="cancel()" type="button" class="btn btn-default">Cancel</button>
            </div>     
        </form>`;
    
    var adminApp = angular.module('adminApp');
    adminApp.directive('mediaUpload', function() {
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

                scope.selectFiles = function() {
                    setTimeout(function() {
                        fileInputEl.click();
                    }, 0);

                };

                var dragCounter = 0;
                rootEl.addEventListener('dragenter', function(ev) {
                    dragCounter++;
                    this.classList.add('media-item-dragging');
                    ev.preventDefault();
                });
                rootEl.addEventListener('dragover', function(ev) {
                    ev.dataTransfer.dropEffect = 'copy';
                    ev.preventDefault();
                });
                rootEl.addEventListener('dragleave', function(ev) {
                    dragCounter--;
                    if(dragCounter === 0) {
                        this.classList.remove('media-item-dragging');
                        ev.preventDefault();
                    }
                });

                rootEl.addEventListener("drop", function(ev) {
                    ev.stopPropagation();
                    ev.preventDefault();

                    var dt = ev.dataTransfer;
                    scope.setFiles(dt.files);
                    fileInputEl.value = '';
                    this.classList.remove('media-item-dragging');
                }, false);
            },
            controller: function ($scope, $q, $location, mediaService) {

                $scope.isImage = mediaService.isImage;
                $scope.getMimeClass = mediaService.getMimeClass;

                $scope.files = [];

                $scope.remove = function(file) {
                    var selectedFiles = $scope.files;
                    for(var i = selectedFiles.length -1; i >= 0; i--) {
                        if(selectedFiles[i].name === file.name) {
                            selectedFiles.splice(i, 1);
                        }
                    }
                };

                function generateName(fileName) {
                    return fileName.split('.')[0].split(/-|_/).map(function (part) {
                        return part.charAt(0).toUpperCase() + part.slice(1);
                    }).join(' ');
                }

                $scope.setFiles = function(newFiles) {
                    var existingFilePaths = $scope.files.map(function(file) { return file.name });

                    for (var i = 0; i < newFiles.length; i++) {
                        var file = newFiles[i];

                        if(existingFilePaths.indexOf(file.name) > -1) {
                            continue;
                        }

                        file.item = {
                            fileSrc: null,
                            type: file.type,
                            tags : []
                        };
                        if(mediaService.isImage(file)) {
                            (function(file) {
                                var reader = new FileReader();
                                reader.readAsDataURL(file);
                                reader.onload = function (e) {
                                    file.item.fileSrc = e.target.result;
                                    $scope.$apply();
                                };
                            }(file));
                        }

                        file.item.name = generateName(file.name);
                        $scope.files.push(file);
                    }
                };

                $scope.upload = function() {
                    var formData = new FormData();
                    var i, file;
                    for (i = 0; i < $scope.files.length; i++) {
                        file = $scope.files[i];
                        formData.append('file_' + i, file);
                        formData.append('name_' + i, file.item.name);
                        formData.append('description_' + i , file.item.description);
                        formData.append('tags_' + i, file.item.tags);
                    }

                    mediaService.uploadItem(formData).success(function() {
                        $location.path('/media');
                        $scope.showSuccess('Upload successful');
                        $scope.cancel();
                        $scope.getItems();
                    }).error(function(err) {
                        $scope.cancel();
                        $scope.getItems();
                        $scope.showError('Error uploading file', err);
                    });
                    $scope.showInfo('Upload in progress...');
                };

                $scope.cancel = function() {
                    $scope.files = [];
                };
            }
        }
    });

})();

(function() {

    /**
     *
     * @type {*}
     */
    var adminApp = angular.module('adminApp');
    adminApp.controller('MediaItemController', function($scope, $rootScope, $location, $routeParams, mediaService) {
        $rootScope.pageTitle = 'Media';

        $scope.isImage = mediaService.isImage;
        $scope.isText = mediaService.isText;
        $scope.isDocument = mediaService.isDocument;
        $scope.getSrcPath = mediaService.getSrcPath;
        $scope.humanFileSize = mediaService.humanFileSize;

        var mediaId = $routeParams.mediaId;


        $scope.cancel = function() {
            $location.path('/media');
        };

        mediaService.getItem(mediaId).then(function(res) {
            $scope.item = res.data;
            return mediaService.isText(res.data) ? mediaService.getItemText(res.data) : null;
        }).then(function(res) {
            if(res) {
                $scope.editorOpts = {
                    mode: 'xml'
                };
                $scope.itemText = res.data;
            }
        }).catch(function(err) {
            $scope.showError('Error getting media item', err);
        });

        $scope.updateItemText = function() {
            mediaService.updateItemText($scope.item, $scope.itemText).success(function() {
                $scope.showSuccess('Media item updated');
                $location.path('/media');
            }).error(function(err) {
                $scope.showError('Could not update text media', err);
            });
        };
    });

})();
(function() {

/**
 *
 * @type {*}
 */
var adminApp = angular.module('adminApp');
adminApp.controller('DeletePageController',
    function($scope, $rootScope, $routeParams, $location, $timeout,
             pageService, $window) {

    var pageId = $routeParams.pageId;
    $scope.status = 410;

    pageService.getPage(pageId).success(function(page) {
        $scope.page = page;

        //default delete status
        page.status = 410;
    }).error(function(err) {
        $scope.showError('Couldn\'t find a page to delete', err);
    });
    pageService.getPages().success(function(pages) {
        $scope.pages = pages;
    }).error(function(err) {
        $scope.showError('Couldn\'t get pages', err);
    });

    $scope.cancel = function() {
        $location.path('');
    };

    $scope.submit = function(form) {

        if(form.$invalid) {
            $scope.submitted = true;
            $window.scrollTo(0,0);
            return;
        }

        var page = $scope.page;

        pageService.deletePage(page).success(function() {
            $location.path('');
            $scope.showInfo('Page: ' + page.name + ' removed.');
        }).error(function(err) {
            $scope.showError('Error deleting page', err);
        });
    };
});

})();
(function() {

/**
 *
 * @type {*}
 */
var adminApp = angular.module('adminApp');
adminApp.controller('PageController',
    function($log, $scope, $rootScope, $routeParams, $location, $timeout,
             pageService, templateService, pluginService, $window) {

    $log.info('Showing page view.');

    $scope.section = $routeParams.section || 'basic';

    $scope.clearNotification();

    var pageId = $routeParams.pageId;

    var parentPageId = $routeParams.parentPageId;
    var order = $routeParams.order;

    //sets the code mirror mode for editing raw include data
    $scope.editorOpts = {
        mode: 'application/json'
    };

    $scope.allPages = [];
    pageService.getPages().success(function(pages) {
        $scope.allPages = pages;
    }).error(function(err) {
        $scope.showError('Couldn\'t get all pages', err);
    });

    var pageSetupFunctions = [];
    pageSetupFunctions.push(function getTemplates(callback) {
        $log.info('Fetching available templates...');
        templateService.doGetAvailableTemplates().success(function(templates) {
            $log.info('Got available templates.');
            $scope.templates = templates;
            callback();
        });
    });
    pageSetupFunctions.push(function getPlugins(callback) {
        $log.debug('Fetching available plugins...');
        pluginService.getPlugins().success(function(availablePlugins) {
            $log.debug('Got available plugins.');
            $scope.availablePlugins = availablePlugins;
            callback();
        });
    });

    if(pageId) {
        $log.debug('Fetching page data for: %s', pageId);
        $scope.pageId = pageId;
        pageSetupFunctions.push(function getPage(callback) {
            pageService.getPage(pageId).success(function(page) {
                $log.debug('Got page data OK.');
                $log.trace('...with data:\n', JSON.stringify(page, null, '\t'));
                $scope.page = page;

                if(page.expiresAt) {
                    page.expiresAt = new Date(page.expiresAt);
                }
                if(page.publishedAt) {
                    page.publishedAt = new Date(page.publishedAt);
                }

                //depopulate redirect page
                if(page.redirect) {
                    page.redirect = page.redirect._id;
                }
                callback();
            });
        });
    } else {
        $scope.page = {
            regions: [],
            useInNav: true
        };
        if(parentPageId) {
            pageSetupFunctions.push(function getParentPage(callback) {
                pageService.getPage(parentPageId).success(function(page) {
                    $scope.page.parent = page;
                    callback();
                });
            });
        } else {
            $scope.page.root = 'top';
        }
    }

    async.series(pageSetupFunctions, function(err) {
        if(err) {
            $scope.showError(err);
        } else {
            //if there's only one template choose it automatically
            if(!$scope.page.template && $scope.templates.length === 1) {
                $scope.page.template = $scope.templates[0];
            }
        }
    });

    $scope.updateUrl = function() {
        $scope.page.url = pageService.generateUrl($scope.page);
    };

    $scope.cancel = function() {
        $location.path('/pages');
    };

    $scope.$watch('page.name', function() {
        if(!pageId && $scope.pageForm && $scope.pageForm.url && $scope.pageForm.url.$pristine) {
            $scope.updateUrl();
        }
    });

    $scope.syncResults = null;

    $scope.synchronizeWithBasePage = function(page) {
        function getRegionFromPage(page, regionName) {
            return page.regions.filter(function(region) {
                return region.name === regionName;
            })[0] || null;
        }
        function containsInclude(region, includeToFind) {
            return region.includes.some(function(include) {
                return include._id === includeToFind._id;
            });
        }
        //get basepage from id value
        $scope.syncResults = [];
        page.template.regions.forEach(function(templateRegion) {
            var syncResult = {
                region: templateRegion.name,
                removedCount: 0,
                sharedCount: 0
            };
            var sharing = (templateRegion.sharing || '').split(/\s+/);
            var pageRegion = getRegionFromPage(page, templateRegion.name);
            if(!pageRegion) {
                pageRegion = {
                    name: templateRegion.name,
                    includes: []
                };
                page.regions.push(pageRegion);
            }
            var baseRegion = getRegionFromPage(page.basePage, templateRegion.name);
            if(baseRegion) {
                var startCount = pageRegion.includes ? pageRegion.includes.length : 0;
                //add additional non-shared includes at the end
                baseRegion.includes.forEach(function(baseInclude) {
                    if(sharing.indexOf('plugins') >= 0 && sharing.indexOf('data') >= 0 &&
                        !containsInclude(pageRegion, baseInclude)) {
                        pageRegion.includes.push(baseInclude);
                    }
                });
                syncResult.sharedCount = pageRegion.includes.length - startCount;
            }
            $scope.syncResults.push(syncResult);
        });

        return page;
    };

    $scope.save = function(form) {
        if(form.$invalid) {
            $scope.submitted = true;
            $window.scrollTo(0,0);
            return;
        }

        var page = $scope.page;
        if(order) {
            page.order = order;
        }

        if(pageId) {
            $log.info('Update page: %s...', pageId);
            $log.trace('...with data:\n%s', JSON.stringify(page, null, '\t'));
            page = pageService.depopulatePage(page);
            pageService.updatePage(pageId, page).success(function() {
                $log.info('Page successfully updated');
                $scope.showSuccess('Page: ' + page.name + ' saved.');
                $location.path('');
            }).error(function(err) {
                $log.error(err, 'Error updating page');
                $scope.showError('Error updating page', err);
            });
        } else {
            $log.info('Creating page...');
            $log.trace('...with data:\n%s', JSON.stringify(page, null, '\t'));

            //create regions based on template
            var pageRegions = [];
            page.template.regions.forEach(function(regionMeta) {
                var newRegion = {};
                newRegion.name = regionMeta.name;
                newRegion.includes = [];
                pageRegions.push(newRegion);
            });
            page.regions = pageRegions;

            if(page.basePage) {
                page = $scope.synchronizeWithBasePage(page);
            }

            page = pageService.depopulatePage(page);
            pageService.createPage(page).then(function(res) {
                var page = res.data;
                $log.info('Page successfully created');
                $scope.showSuccess('Page: ' + page.name + ' created.');
                $location.path('');
            }).catch(function(err) {
                $log.error(err, 'Error creating page');
                $scope.showError('Error adding new page', err);
            });
        }
    };
});

})();
(function() {
    var adminApp = angular.module('adminApp');
    adminApp.factory('pageService', function($http) {

        function PageService() {
            this.pageCache = [];
        }
        PageService.prototype.getPages = function(filter) {
            var self = this;

            var queryKeyValPairs = [];
            if(typeof filter === 'object') {
                for(var key in filter) {
                    if(filter.hasOwnProperty(key)) {
                        queryKeyValPairs.push(encodeURIComponent(key) + '=' + encodeURIComponent(filter[key]));
                    }
                }
            }

            var path = '/_api/pages';
            var url = queryKeyValPairs.length ? path + '?' + queryKeyValPairs.join('&') : path;
            var promise = $http.get(url);
            promise.success(function(pages) {
                self.pageCache = pages;
            });
            return promise;
        };
        PageService.prototype.getPage = function(pageId) {
            return $http.get('/_api/pages/' + pageId);
        };

        PageService.prototype.createPage = function(pageData) {

            if(!pageData.url) {
                pageData.url = this.generateUrl(pageData);
            }

            return $http.post('/_api/pages', pageData);
        };

        PageService.prototype.deletePage = function(page) {
            if(page.published) {
                var pageData = {
                    status: page.status
                };

                if(page.redirect) {
                    pageData.redirect = page.redirect._id;
                }

                //live pages are updated to be gone
                return $http.put('/_api/pages/' + page._id, pageData);
            } else {
                //pages which have never been published can be hard deleted
                return $http.delete('/_api/pages/' + page._id);
            }
        };

        PageService.prototype.updatePage = function(pageId, pageData) {
            return $http.put('/_api/pages/' + pageId, pageData);
        };

        PageService.prototype.createIncludeData = function(config) {

            var includeData = {};

            var schemaProps = config.schema.properties || {};
            for(var name in schemaProps) {
                if(schemaProps.hasOwnProperty(name)) {
                    includeData[name] =
                            typeof schemaProps[name].default !== 'undefined' ? schemaProps[name].default : null;
                }
            }

            return $http.post('/_api/includes', {
                data: includeData
            });
        };

        PageService.prototype.swapIncludes = function(page, regionName, includeOne, includeTwo) {

            //find the region
            var region = page.regions.filter(function(region) {
                return region.name === regionName;
            })[0];

            if(region) {
                var temp = region.includes[includeOne];
                region.includes[includeOne] = region.includes[includeTwo];
                region.includes[includeTwo] = temp;
            }

            return page;
        };

        PageService.prototype.generateUrl = function(page, parent) {

            parent = parent || page.parent;

            var parentUrlPart = null;
            if(parent && parent.url) {
                parentUrlPart = parent.url;
            }
            return (parentUrlPart || '') + '/' + slugify(page.name);
        };

        PageService.prototype.removeInclude = function(page, regionIndex, includeIndex) {

            var i;
            //convert region name to index
            for(i = 0; i < page.regions.length && typeof regionIndex === 'string'; i++) {
                if(page.regions[i].name === regionIndex) {
                    regionIndex = i;
                }
            }

            //remove that index from the regions array
            if(typeof regionIndex === 'number') {
                for(i = page.regions[regionIndex].includes.length - 1; i >= 0; i--) {
                    if(i === includeIndex) {
                        page.regions[regionIndex].includes.splice(i, 1);
                    }
                }
            } else {
                var msg = 'Couldn\'t determine the region that the include to remove belongs to (' + regionIndex + ')';
                throw new Error(msg);
            }

            return page;
        };

        PageService.prototype.depopulatePage = function(page) {

            delete page.createdBy;
            delete page.updatedBy;
            delete page.createdAt;
            delete page.updatedAt;

            if(page.template && page.template._id) {
                page.template = page.template._id;
            }
            if(page.parent && page.parent._id) {
                page.parent = page.parent._id;
            }
            if(page.basePage && page.basePage._id) {
                page.basePage = page.basePage._id;
            }
            if(page.redirect && page.redirect._id) {
                page.redirect = page.redirect._id;
            }
            page.regions = page.regions.filter(function(region) {
                return typeof region === 'object';
            }).map(function(region) {
                region.includes = region.includes.map(function(includeWrapper) {

                    if(includeWrapper.plugin && includeWrapper.plugin._id) {
                        includeWrapper.plugin = includeWrapper.plugin._id;
                    }
                    if(includeWrapper.include && includeWrapper.include._id) {
                        includeWrapper.include = includeWrapper.include._id;
                    }
                    return includeWrapper;
                });

                return region;
            });
            return page;
        };

        return new PageService();
    });

    function slugify(str) {

        str = str || '';
        str = str.replace(/^\s+|\s+$/g, ''); // trim
        str = str.toLowerCase();

        // remove accents, swap ñ for n, etc
        var from = 'ãàáäâẽèéëêìíïîõòóöôùúüûñç·/_,:;';
        var to   = 'aaaaaeeeeeiiiiooooouuuunc------';
        for (var i=0, l=from.length ; i<l ; i++) {
            str = str.replace(new RegExp(from.charAt(i), 'g'), to.charAt(i));
        }

        str = str.replace(/[^a-z0-9 -]/g, '') // remove invalid chars
            .replace(/\s+/g, '-') // collapse whitespace and replace by -
            .replace(/-+/g, '-'); // collapse dashes

        return str;
    }

})();



(function() {

/**
 *
 * @type {*}
 */
var adminApp = angular.module('adminApp');
adminApp.controller('SitemapController', function($scope, $rootScope, $location, siteService, pageService) {

    $rootScope.pageTitle = 'Sitemap';

    var VIEW_MODE_STORAGE_KEY = 'sitemapViewMode';
    $scope.viewMode = sessionStorage.getItem(VIEW_MODE_STORAGE_KEY) || 'view';
    $scope.setViewMode = function(mode) {
        $scope.viewMode = mode;
        sessionStorage.setItem(VIEW_MODE_STORAGE_KEY, mode);
    };

    var getSite = function() {
        siteService.getSite().then(function(site) {
            $scope.site = site;
        }).catch(function(err) {
            $scope.showError('Error getting site', err);
        });
    };

    var getPages = function() {
        pageService.getPages().success(function(allPages){

            var pageMap = {};
            allPages = allPages.filter(function(page) {
                return page.status < 400;
            }).sort(function(a, b) {
                if (a.order < b.order) {
                    return -1;
                } else if (a.order > b.order) {
                    return 1;
                } else {
                    return 0;
                }
            });
            allPages.forEach(function(page) {
                pageMap[page._id] = page;
            });

            var populateChildren = function(pages) {

                pages.forEach(function(currentPage) {

                    currentPage.children = allPages.filter(function(childCandidate) {
                        var candidateParentId = childCandidate.parent ? childCandidate.parent._id : null;
                        return currentPage._id === candidateParentId;
                    });
                    if(currentPage.children.length > 0) {
                        populateChildren(currentPage.children);
                    }
                });
            };

            var primaryRoots = allPages.filter(function(page) {
                return page.root === 'top';
            });
            populateChildren(primaryRoots);

            $scope.pages = primaryRoots;
        }).error(function(err) {
            $scope.showError('Error getting pages', err);
        });
    };

    getSite();
    getPages();

    $scope.addPage = function(parentPage) {

        var parentRoute, siblingsQuery;
        if(parentPage) {
            parentRoute = parentPage._id;
            siblingsQuery = {
                parent: parentPage._id
            };
        } else {
            parentRoute = 'root';
            siblingsQuery = {
                root: 'top'
            };
        }
        $scope.showInfo('Preparing new page...');
        //get future siblings
        pageService.getPages(siblingsQuery).success(function(pages) {

            var highestOrder = pages.map(function(page) {
                return page.order || 0;
            }).reduce(function(prev, curr){
                    return Math.max(prev, curr);
            }, -1);
            highestOrder++;
            $location.path('/pages/new/' + encodeURIComponent(parentRoute) + '/' + encodeURIComponent(highestOrder));
        }).error(function(err) {
            $scope.showError('Unable to determine order of new page', err);
        });
    };

    $scope.removePage = function(page) {

        if(page.published) {
            $location.path('/pages/delete/' + page._id);
        } else {
            var really = window.confirm('Really delete this page?');
            if(really) {
                pageService.deletePage(page).success(function() {
                    window.location.reload();
                    $scope.showInfo('Page: ' + page.name + ' removed.');
                }).error(function(err) {
                    $scope.showError('Error deleting page', err);
                });
            }
        }

    };

    $scope.movePage = function(page, direction) {

        var silbingQuery = {
            order: page.order + direction
        };
        if(page.parent) {
            silbingQuery.parent = page.parent._id;
        } else if(page.root) {
            silbingQuery.root = page.root;
        }

        pageService.getPages(silbingQuery).success(function(siblings) {

            var siblingPage = siblings[0];
            if(!siblingPage) {
                //$scope.showInfo('Couldn\'t re-order pages');
                return;
            }
            async.parallel([
                function(callback) {
                    pageService.updatePage(page._id, {
                        order: page.order + direction,
                        draft: true
                    }).success(function() {
                        callback(null);
                    }).error(function(err) {
                        callback(err);
                    });
                },
                function(callback) {
                    pageService.updatePage(siblingPage._id, {
                        order: siblingPage.order - direction,
                        draft: true
                    }).success(function() {
                        callback(null);
                    }).error(function(err) {
                        callback(err);
                    });
                }
            ], function(err) {
                if(err) {
                    $scope.showError('Problem re-ordering pages', err);
                } else {
                    getPages();
                }
            });
        });
    };

    $scope.moveBack = function(page) {
        $scope.movePage(page, -1);
    };
    $scope.moveForward = function(page) {
        $scope.movePage(page, 1);
    };
});

})();
(function() {

/**
 *
 * @type {*}
 */
var adminApp = angular.module('adminApp');
adminApp.controller('ViewPageController', function($scope, $rootScope, $routeParams) {

    var env = $routeParams.viewPageEnv;
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
                var frameHead = pageFrame.contentWindow.document.getElementsByTagName('head')[0];
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
(function() {

/**
 *
 * @type {*}
 */
var adminApp = angular.module('adminApp');
adminApp.controller('PluginController', function($scope, $rootScope, $log, $routeParams, $location, $window,
                                                 pluginService) {

    var pluginId = $routeParams.pluginId;

    //sets the code mirror mode for editing raw plugin data
    $scope.editorOpts = {
        mode: 'application/json'
    };

    $scope.plugin = {};

    if(pluginId) {
        $scope.pluginId = pluginId;
        pluginService.getPlugin(pluginId).success(function(plugin) {
            $scope.plugin = plugin;
        }).error(function(err) {
            $scope.showError('Error getting plugin', err);
        });
    }

    $scope.reset = function() {
        pluginService.resetPlugin($scope.plugin).success(function() {
            $scope.showSuccess('Cache cleared');
        }).error(function(err) {
            $scope.showError('Error getting plugin', err);
        });
    };

    $scope.cancel = function() {
        $location.path('/plugins');
    };

    $scope.save = function(form) {
        if(form.$invalid) {
            $scope.submitted = true;
            $window.scrollTo(0,0);
            return;
        }

        if(pluginId) {
            pluginService.updatePlugin(pluginId, $scope.plugin).success(function() {
                $log.info('Plugin saved');
                $scope.showSuccess('Plugin updated.');
                $location.path('/plugins');
            }).error(function(err) {
                $scope.showError('Error updating plugin', err);
            });
        } else {
            pluginService.createPlugin($scope.plugin).success(function() {
                $log.info('Plugin created');
                $scope.showSuccess('Plugin created.');
                $location.path('/plugins');
            }).error(function(err) {
                $scope.showError('Error saving plugin', err);
            });
        }
    };

    $scope.remove = function() {
        var really = window.confirm('Really delete this plugin?');
        if(really) {
            pluginService.deletePlugin($scope.plugin._id).success(function () {
                $scope.showInfo('Plugin deleted');
                $location.path('/plugins');
            }).error(function (err) {
                $scope.showError('Error deleting plugin', err);
            });
        }
    };
});



})();
(function() {

/**
 *
 * @type {*}
 */
var adminApp = angular.module('adminApp');
adminApp.controller('PluginListController', function($scope, $rootScope, $routeParams, $location, pluginService) {

    $scope.plugins = [];

    pluginService.getPlugins().success(function(plugins) {
        $scope.plugins = plugins;
    }).error(function(err) {
        $scope.showError('Error getting plugins', err);
    });

});

})();
(function() {
    var adminApp = angular.module('adminApp');
    adminApp.factory('pluginService', function($http) {

        function PluginService() {
        }
        PluginService.prototype.getPlugins = function() {
            return $http.get('/_api/plugins');
        };
        PluginService.prototype.getPlugin = function(pluginId) {
            return $http.get('/_api/plugins/' + pluginId);
        };

        PluginService.prototype.createPlugin = function(pluginData) {
            return $http.post('/_api/plugins', pluginData);
        };

        PluginService.prototype.deletePlugin = function(pluginId) {
            return $http.delete('/_api/plugins/' + pluginId);
        };

        PluginService.prototype.updatePlugin = function(pluginId, pluginData) {
            return $http.put('/_api/plugins/' + pluginId, pluginData);
        };

        PluginService.prototype.resetPlugin = function(pluginData) {
            return $http.put('/_cache/plugins', {
                module: pluginData.module
            });
        };


        return new PluginService();
    });

})();



(function() {

/**
 *
 * @type {*}
 */
var adminApp = angular.module('adminApp');
adminApp.controller('PublishingController', function($scope, $rootScope, $routeParams, $window, $location,
                                                     publishingService) {

    var preQueued = $routeParams.pageId || null;

    //get all pages with drafts
    publishingService.getDrafts().success(function(drafts) {
        $scope.drafts = drafts;

        drafts.forEach(function(page) {
           if(page._id === preQueued) {
               page.queued = true;
           }
        });
    }).error(function(err) {
        $scope.showError('Error getting drafts to publish', err);
    });

    $scope.cancel = function() {
        $location.path('/pages');
    };

    $scope.publish = function() {
        var toPublishIds = $scope.drafts.filter(function(page) {
            return page.queued;
        }).map(function(page) {
            return page._id;
        });

        if(toPublishIds.length === 0) {
            $window.scrollTo(0,0);
            $scope.submitted = true;
            return;
        }

        publishingService.publish(toPublishIds).success(function() {
            $scope.showSuccess('Publishing successful');
            $location.path('/');
        }).error(function(err) {
            $scope.showError('Error performing publish', err);
        });
    };
});

})();
(function() {
    var adminApp = angular.module('adminApp');
    adminApp.factory('publishingService', function($http, pageService) {

        function PublishingService() {

        }
        PublishingService.prototype.getDrafts = function() {
            return pageService.getPages({
                draft: true
            });
        };

        PublishingService.prototype.publish = function(draftIds) {
            return $http.post('/_publish/pages', draftIds);
        };

        return new PublishingService();
    });

})();



(function() {
    var adminApp = angular.module('adminApp');
    adminApp.factory('siteService', function($http) {

        function SiteService() {

        }
        SiteService.prototype.getSite = function() {
            return $http.get('/_api/sites').then(function(res) {
                return res.data[0];
            });
        };

        SiteService.prototype.updateSite = function(siteId, siteData) {
            delete siteData._id;
            return $http.put('/_api/sites/' + siteId, siteData);
        };

        return new SiteService();
    });

})();



(function() {

    /**
     *
     * @type {*}
     */
    var adminApp = angular.module('adminApp');
    adminApp.controller('SiteSettingsController', function($scope, $rootScope, $location, $window, $q, pageService,
                                                           siteService) {
        $scope.defaultPage = {
            redirect: null
        };

        siteService.getSite().then(function(site) {
            $scope.site = site;
        });

        pageService.getPages().success(function(pages) {
            $scope.availablePages = pages.filter(function(page) {
                return page.status === 200 && page.parent !== null;
            });
            $scope.defaultPage = pages.filter(function(page) {
                return page.url === '/';
            })[0];

        });

        $scope.cancel = function() {
            $location.path('/');
        };

        $scope.save = function(form) {

            if(form.$invalid) {
                $window.scrollTo(0,0);
                $scope.submitted = true;
                return;
            }
            var site = $scope.site;

            var promise = $q.when();
            if($scope.defaultPage) {
                //get existing default pages (where url == /)
                promise = promise.then(function() {
                    return pageService.getPages({
                        url: '/'
                    });
                }).then(function(response) {
                    var pages = response.data;
                    var page = pages.length ? pages[0] : null;

                    var defaultPageData = {
                        name: 'Default page',
                        url: '/',
                        redirect: $scope.defaultPage.redirect,
                        status: 301
                    };

                    if(!page) {
                        //create new
                        return pageService.createPage(defaultPageData);
                    } else if(page && page.status === 301) {
                        //update an existing default page redirect
                        return pageService.updatePage(page._id, defaultPageData);
                    } else {
                        var msg = 'Cannot set the default page. ' +
                            page.name + ' has been explicitly set as the default page';
                        throw new Error(msg);
                    }
                    //else the page has the url / explicitly set. leave it alone
                }).catch(function(err) {
                     $scope.showError('Unable to set default page', err);
                });
            }


            promise.then(function() {
                return siteService.updateSite(site._id, site);
            }).then(function() {
                $scope.showSuccess('Site updated.');
                $location.path('/');
            }).catch(function(err) {
                $scope.showError('Error updating site', err);
            });

        };
    });

})();
(function() {

/**
 *
 * @type {*}
 */
var adminApp = angular.module('adminApp');
adminApp.controller('TemplateController', function($log, $scope, $rootScope, $routeParams, $location, $window,
                                                   templateService) {
    $log.info('Showing Template View');

    var templateId = $routeParams.templateId;

    $scope.template = {
        properties: [],
        regions: [],
        regionData: []
    };

    templateService.getTemplateSources().success(function(templateSources) {
        $scope.templateSources = templateSources;
    });

    $scope.$watch('template.src', function(val) {
        if(val && !templateId) {
            $log.debug('Fetching regions for template src: %s...', val);
            $scope.scanRegions(val);
        }
    });

    if(templateId) {
        $scope.templateId = templateId;
        $log.debug('Fetching template data for id: %s...', templateId);
        templateService.getTemplate(templateId).success(function(template) {
            $log.debug('Got template data:\n', JSON.stringify(template, null, '\t'));
            $scope.template = template;
        }).error(function(err) {
            $log.error(err, 'Error getting template');
            $scope.showError('Error getting template', err);
        });
    }

    $scope.addProperty = function() {
        $scope.template.properties.push({
            name: '',
            value: ''
        });
    };

    $scope.removeProperty = function(prop) {
        var index = $scope.template.properties.indexOf(prop);
        if (index > -1) {
            $scope.template.properties.splice(index, 1);
        }
    };


    $scope.scanRegions = function(templateSrc) {

        templateSrc = templateSrc || $scope.template.src;

        templateService.getTemplateRegions(templateSrc).success(function(newRegions) {
            $log.debug('Got regions: %s', newRegions);

            function isRegionNew(regionName) {
                return !$scope.template.regions.some(function(region) {
                    return region.name === regionName;
                });
            }

            newRegions.forEach(function(regionName) {
                if(isRegionNew(regionName)) {
                    $scope.template.regions.push({
                        name: regionName,
                        includes: []
                    });
                }
            });
        }).error(function(err) {
            $scope.showError('Error getting template regions', err);
        });
    };

    $scope.cancel = function() {
        $location.path('/templates');
    };

    $scope.save = function(form) {
        if(form.$invalid) {
            $window.scrollTo(0,0);
            $scope.submitted = true;
            return;
        }

        var template = $scope.template;

        //remove any empty properties
        for(var i = template.properties.length - 1; i >= 0; i--) {
            var prop = template.properties[i];
            if(!prop.name) {
                template.properties.splice(i, 1);
            }
        }

        if(templateId) {
            $log.info('Updating template: %s...', templateId);
            $log.debug('with data:\n%s', JSON.stringify($scope.template, null, '\t'));
            templateService.updateTemplate(templateId, $scope.template).success(function() {
                $log.info('Template updated successfully');
                $scope.showSuccess('Template updated.');
                $location.path('/templates');
            }).error(function(err) {
                $log.error(err, 'Error updating template');
                $scope.showError('Error updating template', err);
            });
        } else {
            $log.info('Creating new template...');
            $log.debug('with data:\n%s', JSON.stringify($scope.template, null, '\t'));
            templateService.createTemplate($scope.template).success(function() {
                $log.info('Template created successfully');
                $scope.showSuccess('Template created.');
                $location.path('/templates');
            }).error(function(err) {
                $log.error(err, 'Error creating template');
                $scope.showError('Error creating template', err);
            });
        }
    };

    $scope.remove = function() {
        var really = window.confirm('Really delete this template?');
        if(really) {
            $log.info('Deleting template: %s...', $scope.template._id);
            templateService.deleteTemplate($scope.template._id).success(function() {
                $log.info('Template deleted');
                $location.path('/templates');
            }).error(function (err) {
                $log.error(err, 'Could not delete template');
                $scope.showError('Error deleting template', err);
            });
        }
    };
});

})();
(function() {

/**
 *
 * @type {*}
 */
var adminApp = angular.module('adminApp');
adminApp.controller('TemplateListController', function($scope, $rootScope, $routeParams, $location, templateService) {

    $rootScope.pageTitle = 'Templates';

    $scope.templates = [];

    templateService.doGetAvailableTemplates().success(function(templates) {
        $scope.templates = templates;
    }).error(function(err) {
        $scope.showError('Error getting templates', err);
    });

});

})();
(function() {
    var adminApp = angular.module('adminApp');
    adminApp.factory('templateService', function($http) {

        function TemplateService() {
        }
        TemplateService.prototype.getTemplateSources = function() {
            return $http.get('/_templates/available');
        };
        TemplateService.prototype.getTemplateRegions = function(templateSrc) {
            return $http.get('/_templates/template-regions', {
                params: {
                    templateSrc: templateSrc
                }
            });
        };
        TemplateService.prototype.doGetAvailableTemplates = function() {
            return $http.get('/_api/templates');
        };
        TemplateService.prototype.getTemplate = function(templateId) {
            return $http.get('/_api/templates/' + templateId);
        };
        TemplateService.prototype.createTemplate = function(templateData) {
            return $http.post('/_api/templates', templateData);
        };

        TemplateService.prototype.updateTemplate = function(templateId, templateData) {
            return $http.put('/_api/templates/' + templateId, templateData);
        };

        TemplateService.prototype.deleteTemplate = function(templateId) {
            return $http.delete('/_api/templates/' + templateId);
        };

        return new TemplateService();
    });

})();



(function() {

    /**
     *
     * @type {*}
     */
    var adminApp = angular.module('adminApp');
    adminApp.controller('UserController', function($scope, $rootScope, $log, $location, $routeParams, $window,
                                                   userService) {
        $rootScope.pageTitle = 'User';

        var userId = $routeParams.userId;
        $scope.userId = userId;

        $scope.roles = [{
            name: 'editor',
            label: 'Editor'
        },{
            name: 'developer',
            label: 'Developer'
        },{
            name: 'admin',
            label: 'Admin'
        }];

        if(userId) {
            userService.getUser(userId).success(function(user) {
                $scope.user = user;
            });
        }

        $scope.cancel = function() {
            $location.path('/users');
        };

        $scope.save = function(form) {
            if(form.$invalid) {
                $window.scrollTo(0,0);
                $scope.submitted = true;
                return;
            }
            var user = $scope.user;
            if(userId) {
                userService.updateUser(userId, user).success(function() {
                    $scope.showSuccess('User updated.');
                    $location.path('/users');
                }).error(function(err) {
                    $scope.showError('Error updating user', err);
                });
            } else {
                userService.createUser(user).success(function() {
                    $scope.showSuccess('User created.');
                    $location.path('/users');
                }).error(function(err) {
                    $scope.showError('Error creating user', err);
                });
            }
        };

        $scope.remove = function() {
            userService.deleteTemplate($scope.user._id).success(function () {
                $log.info('User removed');
                $location.path('/templates');
            }).error(function(err) {
                $scope.showError('Error deleting template', err);
            });
        };
    });

})();
(function() {

    /**
     *
     * @type {*}
     */
    var adminApp = angular.module('adminApp');
    adminApp.controller('UserListController', function($scope, $rootScope, $location, userService) {
        $rootScope.pageTitle = 'Users';

        userService.getUsers().success(function(users) {
            $scope.users = users;
        });
    });

})();
(function() {
    var adminApp = angular.module('adminApp');
    adminApp.factory('userService', function($http) {

        function UserService() {

        }
        UserService.prototype.getUsers = function() {
            return $http.get('/_api/users');
        };
        UserService.prototype.getUser = function(userId) {
            return $http.get('/_api/users/' + userId);
        };

        UserService.prototype.createUser = function(userData) {
            return $http.post('/_api/users', userData);
        };

        UserService.prototype.deleteUser = function(userId) {
            return $http.delete('/_api/users/' + userId);
        };

        UserService.prototype.updateUser = function(userId, userData) {
            return $http.put('/_api/users/' + userId, userData);
        };

        return new UserService();
    });

})();


