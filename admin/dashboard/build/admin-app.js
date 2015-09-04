(function() {
    var adminApp = angular.module('adminApp', [
        'ngRoute',
        'ngResource',
        'ngTagsInput',
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
            when('/pages/delete/:pageId', {
                templateUrl: '/_static/dashboard/app/pages/delete-page.html',
                controller: 'DeletePageController'
            }).

            //parts
            when('/parts', {
                templateUrl: '/_static/dashboard/app/parts/part-list.html',
                controller: 'PartListController'
            }).
            when('/parts/new', {
                templateUrl: '/_static/dashboard/app/parts/part.html',
                controller: 'PartController'
            }).
            when('/parts/:partId', {
                templateUrl: '/_static/dashboard/app/parts/part.html',
                controller: 'PartController'
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

    adminApp.controller("MainController", function($scope, $location, $timeout) {
        $scope.menuClass = function(page) {

            //default page
            var path = $location.path();
            if(path === '/') {
                path = '/pages';
            }
            var match = path.indexOf(page) === 0;
            return match ? "active" : "";
        };

        //notications
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
            }, 1000 * 10)
        })
    });

})();

(function() {
    var adminApp = angular.module('adminApp');
    adminApp.directive('bsHasError', function() {
        return {
            restrict: "A",
            link: function(scope, element, attrs, ctrl) {
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

    /**
     *
     * @type {*}
     */
    var adminApp = angular.module('adminApp');
    adminApp.controller("MacrosController", function($scope, $rootScope, $routeParams, $location, templateService) {
        $rootScope.pageTitle = "Macros";
    });

})();

(function() {

/**
 *
 * @type {*}
 */
var adminApp = angular.module('adminApp');
adminApp.controller('MediaController', function($scope, $rootScope, $location, mediaService) {
    $rootScope.pageTitle = 'Media';

    $scope.isImage = mediaService.isImage;
    $scope.getMimeClass = mediaService.getMimeClass;
    $scope.mediaItems = [];
    $scope.availableTags = [];
    $scope.selectedTags = [];

    $scope.showItem = function(item) {
        $location.path('/media/' + item._id);
    };

    $scope.toggleTag = function(tag) {
        if(tag.on) {
            deselectTag(tag);
        } else {
            selectTag(tag);
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
        updateFilter();
    }

    function deselectTag(oldTag) {
        oldTag.on = false;
        $scope.selectedTags = $scope.selectedTags.filter(function(tag) {
            return oldTag.text !== tag.text;
        });
        updateFilter();
    }

    function updateFilter() {

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

    mediaService.getItems().success(function(items) {
        $scope.mediaItems = items;
        updateFilter();

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
        console.log($scope.availableTags);
        $scope.availableTags = availableTags;
    }).error(function(err) {
        $scope.showError("Error getting media items", err);
    });
});

})();
(function() {
    var adminApp = angular.module('adminApp');
    adminApp.factory('mediaService', function($http) {

        function MediaService() {
        }
        MediaService.prototype.getItems = function() {
            return $http.get('/_api/media');
        };
        MediaService.prototype.getItem = function(mediaId) {
            return $http.get('/_api/media/' + mediaId);
        };

        MediaService.prototype.updateItemText = function(mediaData, content) {
            return $http.put('/_media/' + mediaData.fileName, {
                content: content
            });
        };

        MediaService.prototype.deleteItem = function(mediaId) {
            return $http.delete('/_api/media/' + mediaId);
        };

        MediaService.prototype.uploadItem = function(file, mediaData) {
            var formData = new FormData();
            formData.append("file", file);
            formData.append("name", mediaData.name);
            formData.append("description", mediaData.description);
            formData.append("tags", mediaData.tags);

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

        //some utils
        MediaService.prototype.isImage = function(item) {
            return item && !!item.type.match(/image\/[jpeg|png|gif]/);
        };
        MediaService.prototype.isText = function(item) {
            return item && !!item.type.match(/text\/[plain|json|html]/);
        };

        MediaService.prototype.getMimeClass = function(item) {
            return 'media-' + item.type.split('/')[1];
        };

        //thanks http://stackoverflow.com/a/14919494/200113
        MediaService.prototype.humanFileSize = function(bytes, si) {
            var exp = Math.log(bytes) / Math.log(1024) | 0;
            var result = (bytes / Math.pow(1024, exp)).toFixed(2);

            return result + ' ' + (exp == 0 ? 'bytes': 'KMGTPEZY'[exp - 1] + 'B');
        };

        return new MediaService();
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
        $scope.humanFileSize = mediaService.humanFileSize;

        var mediaId = $routeParams.mediaId;

        $scope.deleteItem = function(item) {
            var really = window.confirm('Really delete the item, ' + item.name + '?');
            if(really) {
                mediaService.deleteItem(item._id).success(function() {
                    $location.path('/media');
                    $scope.showInfo("Media: " + item.name + " removed.");
                }).error(function(err) {
                    $scope.showError("Error deleting page", err);
                });
            }
        };

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
adminApp.controller('MediaUploadController', function($scope, $rootScope, $q, $location, $http, $window, mediaService) {
    $rootScope.pageTitle = 'Upload new media';

    $scope.media = {};

    var availableTags = [];
    mediaService.getItems().success(function(items) {
        var seen = {};
        availableTags = items.reduce(function(allTags, item) {
            return allTags.concat(item.tags.filter(function(tag) {
                return tag.text;
            }));
        }, []).filter(function(tag) {
            return seen.hasOwnProperty(tag) ? false : (seen[tag] = true);
        });
    });

    $scope.getMatchingTags = function(text) {
        text = text.toLowerCase();
        var promise = $q(function(resolve) {
            availableTags.filter(function(tag) {
                return tag.text && tag.text.toLowerCase().indexOf(text) > -1;
            });
            resolve(availableTags)
        });
        return promise;
    };

    $scope.setFiles = function(files) {
        $scope.media.file = files[0];
        $scope.fileName = files[0].name;
        if(files[0] && files[0].type.match(/image\/[jpeg|png|gif]/)) {
            var reader = new FileReader();
            reader.readAsDataURL(files[0]);

            reader.onload = function (e) {
                $scope.fileSrc = e.target.result;
                $scope.$apply();
            };
        } else {
            $scope.fileSrc = null;
            $scope.$apply();
        }
    };

    $scope.upload = function(form) {

        if(form.$invalid || !$scope.media.file) {
            $window.scrollTo(0,0);
            $scope.submitted = true;
            return;
        }

        mediaService.uploadItem($scope.media.file, {
           name: $scope.media.name,
           description: $scope.media.description,
           tags: JSON.stringify($scope.media.tags)
        }).success(function() {
            $location.path('/media');
            $scope.showSuccess('Upload successful');
        }).error(function(err) {
            $scope.showError('Error uploading file', err);
        });
        $scope.showInfo('Upload in progress...');
    };

    $scope.cancel = function() {
        $location.path("/media");
    };
});

})();
(function() {

/**
 *
 * @type {*}
 */
var adminApp = angular.module('adminApp');
adminApp.controller("notificationsController", function($scope, $rootScope, $timeout) {
    $scope.message = null;



});

})();
(function() {

/**
 *
 * @type {*}
 */
var adminApp = angular.module('adminApp');
adminApp.controller("DeletePageController",
    function($scope, $rootScope, $routeParams, $location, $timeout,
             pageService, templateService, partService, $window) {

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
        $location.path("");
    };

    $scope.submit = function(form) {

        if(form.$invalid) {
            $scope.submitted = true;
            $window.scrollTo(0,0);
            return;
        }

        var page = $scope.page;

        pageService.deletePage(page).success(function() {
            $location.path("");
            $scope.showInfo("Page: " + page.name + " removed.");
        }).error(function(err) {
            $scope.showError("Error deleting page", err);
        });
    }
});

})();
(function() {

/**
 *
 * @type {*}
 */
var adminApp = angular.module('adminApp');
adminApp.controller("PageController",
    function($log, $scope, $rootScope, $routeParams, $location, $timeout,
             pageService, templateService, partService, $window) {

    $log.info('Showiing page view.');

    $scope.section = $routeParams.section || 'basic';

    $scope.clearNotification();

    var pageId = $routeParams.pageId;

    var parentPageId = $routeParams.parentPageId;
    var order = $routeParams.order;

    //sets the code mirror mode for editing raw part data
    $scope.editorOpts = {
        mode: 'application/json'
    };

    $scope.editRegions = false;
    $scope.toggleEditRegions = function() {
        $scope.editRegions = !$scope.editRegions;
    };

    $scope.selectedRegionIndex = -1;
    $scope.template = null;

    var pageSetupFunctions = [];
    pageSetupFunctions.push(function getTemplates(callback) {
        $log.info('Fetching available templates...');
        templateService.doGetAvailableTemplates().success(function(templates) {
            $log.info('Got available templates.');
            $scope.templates = templates;
            callback()
        });
    });
    pageSetupFunctions.push(function getParts(callback) {
        $log.debug('Fetching available parts...');
        partService.getParts().success(function(parts) {
            $log.debug('Got available parts.');
            $scope.parts = parts;
            callback()
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

                $scope.template = $scope.templates.filter(function(template) {
                    return page.template && page.template._id === template._id;
                })[0] || null;

                page.regions = page.regions.map(function(region) {
                    region.data = stringifyData(region.data);
                    region.dataFromServer = !!region.data;
                    return region;
                });

                callback();
            });
        });
    } else {
        $scope.page = {
            regions: []
        };
        if(parentPageId) {
            pageSetupFunctions.push(function getParentPage(callback) {
                pageService.getPage(parentPageId).success(function(page) {
                    $scope.page.parent = page;
                    callback();
                });
            });
        } else {
            $scope.page.root = 'primary';
        }
    }

    async.series(pageSetupFunctions, function(err) {
        if(err) {
            $scope.showError(err);
        } else {
            //if there's only one template choose it automatically
            if(!$scope.page.template && $scope.templates.length === 1) {
                $scope.selectTemplate($scope.templates[0]);
            }
        }
    });

    $scope.updateUrl = function() {
        $scope.page.url = pageService.generateUrl($scope.page);
    };

    $scope.cancel = function() {
        $location.path("/pages");
    };

    $scope.selectTemplate = function(template) {

        template.regions = template.regions.map(function(region) {
            region.data = typeof data !== 'string' ? stringifyData(region.data) : region.data;
            return region;
        });

        $scope.template = template;

        if($scope.page && template) {
            $scope.page.regions = [];
            template.regions.forEach(function(region) {
                $scope.page.regions.push(region);
            });
        }
    };

    $scope.$watch('page.name', function() {
        if($scope.pageForm && $scope.pageForm.url.$pristine && !pageId) {
            $scope.updateUrl();
        }
    });

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

        //unpopulate
        delete page.createdBy;
        delete page.updatedBy;
        delete page.createdAt;
        delete page.updatedAt;
        page.template = $scope.template._id;
        if(page.parent && page.parent._id) {
            page.parent = page.parent._id;
        }
        if(page.redirect && page.redirect._id) {
            page.redirect = page.redirect._id;
        }
        page.regions = page.regions.filter(function(region) {
            return typeof region === 'object';
        }).map(function(region) {
            if(region.part) {
                region.part = region.part._id;
            }
            if(isJson(region.data)) {
                region.data = JSON.parse(region.data);
            }
            return region;
        });

        if(pageId) {
            $log.info('Update page: %s...', pageId);
            $log.trace('...with data:\n%s', JSON.stringify(page, null, '\t'));
            pageService.updatePage(pageId, page).success(function(res) {
                $log.info('Page successfully updated');
                $scope.showSuccess("Page: " + page.name + " saved.");
                $location.path("");
            }).error(function(err) {
                $log.error(err, 'Error updating page');
                $scope.showError("Error updating page", err);
            });
        } else {
            $log.info('Creating page...');
            $log.trace('...with data:\n%s', JSON.stringify(page, null, '\t'));
            pageService.createPage(page).success(function() {
                $log.info('Page successfully created');
                $scope.showSuccess("Page: " + page.name + " created.");
                $location.path("");
            }).error(function(err) {
                $log.error(err, 'Error creating page');
                $scope.showError("Error adding new page", err);
            });
        }
    };


});


    function stringifyData(val) {
        return typeof val === 'object' ? JSON.stringify(val, null, 2) : val;
    }

    function isJson(str) {
        try {
            JSON.parse(str);
        } catch(e) {
            return false;
        }
        return true;
    }
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

        PageService.prototype.generateUrl = function(page, parent) {

            parent = parent || page.parent;

            if(parent && parent.url) {
                var parentUrlPart = parent.url;
            }
            return (parentUrlPart || '') + '/' + slugify(page.name);
        };

        return new PageService();
    });

    function slugify(str) {

        str = str || '';
        str = str.replace(/^\s+|\s+$/g, ''); // trim
        str = str.toLowerCase();

        // remove accents, swap ñ for n, etc
        var from = "ãàáäâẽèéëêìíïîõòóöôùúüûñç·/_,:;";
        var to   = "aaaaaeeeeeiiiiooooouuuunc------";
        for (var i=0, l=from.length ; i<l ; i++) {
            str = str.replace(new RegExp(from.charAt(i), 'g'), to.charAt(i));
        }

        str = str.replace(/[^a-z0-9 -]/g, '') // remove invalid chars
            .replace(/\s+/g, '-') // collapse whitespace and replace by -
            .replace(/-+/g, '-'); // collapse dashes

        return str;
    }

    function getNewPageName(pages) {

        var defaultName = 'New Page ';
        var pageRegex = new RegExp(defaultName + '(\\d+)');

        var largest = 0;
        pages.forEach(function(page) {
            if(page.name) {
                var result = pageRegex.exec(page.name);
                if(result && parseInt(result[1]) > largest) {
                    largest = parseInt(result[1]);
                }
            }
        });
        largest++;
        return defaultName + largest;
    }

})();



(function() {

/**
 *
 * @type {*}
 */
var adminApp = angular.module('adminApp');
adminApp.controller("SitemapController", function($scope, $rootScope, $location, siteService, pageService) {

    $rootScope.pageTitle = "Sitemap";

    var VIEW_MODE_STORAGE_KEY = 'sitemapViewMode';
    $scope.viewMode = sessionStorage.getItem(VIEW_MODE_STORAGE_KEY) || 'view';
    $scope.setViewMode = function(mode) {
        $scope.viewMode = mode;
        sessionStorage.setItem(VIEW_MODE_STORAGE_KEY, mode);
    };

    var getSite = function() {
        siteService.getSite().success(function(site) {
            $scope.site = site;
        }).error(function(err) {
            $scope.showError("Error getting site", err);
        });
    };

    var getPages = function() {
        pageService.getPages().success(function(allPages){

            var pageMap = {};
            allPages = allPages.filter(function(page) {
                return page.status < 400;
            }).sort(function(a, b) {
                if (a.order < b.order)
                    return -1;
                if (a.order > b.order)
                    return 1;
                return 0;
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
                return page.root === "primary";
            });
            populateChildren(primaryRoots);

            $scope.pages = primaryRoots;
        }).error(function(err) {
            $scope.showError("Error getting pages", err);
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
            }
        } else {
            parentRoute = 'root';
            siblingsQuery = {
                root: 'primary'
            }
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
                    $scope.showInfo("Page: " + page.name + " removed.");
                }).error(function(err) {
                    $scope.showError("Error deleting page", err);
                });
            }
        }

    };

    $scope.movePage = function(page, direction) {

        var silbingQuery = {
            order: page.order + direction
        };
        if(page.parent) {
            silbingQuery.parent = parent.page;
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
                        order: page.order + direction
                    }).success(function() {
                        callback(null)
                    }).error(function(err) {
                        callback(err);
                    });
                },
                function(callback) {
                    pageService.updatePage(siblingPage._id, {
                        order: siblingPage.order - direction
                    }).success(function() {
                        callback(null)
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
            })
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
adminApp.controller("ViewPageController",
    function($scope, $rootScope, $routeParams) {

    var env = $routeParams.env;
    var url = $routeParams.url;

    $scope.getPageUrl = function() {
        var staging = env === 'preview';
        return (url || '/') + '?_preview=' + staging;
    };
});

adminApp.directive('pageHolder', function() {
    return {
        restrict: 'E',
        transclude: true,
        replace: true,
        template: '<div class="my-div" ng-transclude></div>',
        link: function link(scope, element, attrs) {

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
(function() {

/**
 *
 * @type {*}
 */
var adminApp = angular.module('adminApp');
adminApp.controller("PartController", function($scope, $rootScope, $routeParams, $location, $window, partService) {

    $rootScope.pageTitle = "Page Part";

    var partId = $routeParams.partId;
    $scope.partId = partId;

    //sets the code mirror mode for editing raw part data
    $scope.editorOpts = {
        mode: 'application/json'
    };

    $scope.part = {};

    if(partId) {
        partService.getPart(partId).success(function(part) {
            $scope.part = part;
        }).error(function(err) {
            $scope.showError("Error getting part", err);
        });
    }

    $scope.reset = function() {
        partService.resetPart($scope.part).success(function() {
            $scope.showSuccess("Cache cleared");
        }).error(function(err) {
            $scope.showError("Error getting part", err);
        })
    };

    $scope.cancel = function() {
        $location.path("/parts");
    };

    $scope.save = function(form) {
        if(form.$invalid) {
            $scope.submitted = true;
            $window.scrollTo(0,0);
            return;
        }

        if(partId) {
            partService.updatePart(partId, $scope.part).success(function(res) {
                console.log("Part saved");
                $scope.showSuccess("Part updated.");
                $location.path("/parts");
            }).error(function(err) {
                $scope.showError("Error updating part", err);
            });
        } else {
            partService.createPart($scope.part).success(function(res) {
                console.log("Part created");
                $scope.showSuccess("Part created.");
                $location.path("/parts");
            }).error(function(err) {
                $scope.showError("Error saving part", err);
            });
        }
    };

    $scope.remove = function() {
        var really = window.confirm('Really delete this part?');
        if(really) {
            partService.deletePart($scope.part._id).success(function (res) {
                $scope.showInfo("Part removed", err);
                $location.path("/parts");
            }).error(function (err) {
                $scope.showError("Error deleting part", err);
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
adminApp.controller('PartListController', function($scope, $rootScope, $routeParams, $location, partService) {

    $rootScope.pageTitle = "Page Parts";

    $scope.parts = [];

    partService.getParts().success(function(parts) {
        $scope.parts = parts;
    }).error(function(err) {
        $scope.showError("Error getting parts", err);
    });

});

})();
(function() {
    var adminApp = angular.module('adminApp');
    adminApp.factory('partService', function($http) {

        function PartService() {
            this.pageCache = [];
        }
        PartService.prototype.getParts = function() {
            return $http.get('/_api/parts');
        };
        PartService.prototype.getPart = function(partId) {
            return $http.get('/_api/parts/' + partId);
        };

        PartService.prototype.createPart = function(partData) {
            return $http.post('/_api/parts', partData);
        };

        PartService.prototype.deletePart = function(partId) {
            return $http.delete('/_api/parts/' + partId);
        };

        PartService.prototype.updatePart = function(partId, partData) {
            return $http.put('/_api/parts/' + partId, partData);
        };

        PartService.prototype.resetPart = function(partData) {
            return $http.put('/_cache/parts', {
                module: partData.module
            });
        };


        return new PartService();
    });

})();



(function() {

/**
 *
 * @type {*}
 */
var adminApp = angular.module('adminApp');
adminApp.controller('PublishingController', function($scope, $rootScope, $routeParams, $window, $location, publishingService) {

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
            return $http.get('/_api/sites/1');
        };

        SiteService.prototype.updateSite = function(siteData) {
            return $http.put('/_api/sites/1', siteData);
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
    adminApp.controller("SiteSettingsController", function($scope, $rootScope, $location, $window, pageService, siteService) {

        $scope.defaultPage = null;

        siteService.getSite().success(function(site) {
            $scope.site = site;
        });

        pageService.getPages().success(function(pages) {
            $scope.pages = pages.filter(function(page) {
                return page.status === 200;
            });
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

            if($scope.defaultPage) {
                async.waterfall([
                    function(cb) {
                        pageService.getPages({
                            url: '/'
                        }).success(function(pages) {
                            var page = pages && pages.length ? pages[0] : null;
                            cb(null, page);
                        }).error(function(e) {
                            cb(e);
                        })
                    },
                    function(page) {
                        //if a page without the default url is already set...
                        var defaultPageData = {
                            name: 'Default page',
                            url: '/',
                            redirect: $scope.defaultPage,
                            status: 301
                        };
                        if(!page) {
                            defaultPageData.url = '/';
                            pageService.createPage(defaultPageData);
                        } else if(page) {
                            pageService.updatePage(page._id, defaultPageData);
                        }
                    }
                ], function(err) {
                    $scope.showError('Unable to set default page', err);
                });
            }

            siteService.updateSite(site).success(function() {
                $scope.showSuccess('Site updated.');
                $location.path('/');
            }).error(function(err) {
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
                                                   templateService, partService) {

    $log.info('Showing Template View');

    $rootScope.pageTitle = 'Template';


    var templateId = $routeParams.templateId;
    $scope.templateId = templateId;

    $scope.selectedRegionIndex = 0;
    $scope.template = {
        properties: [],
        regions: [],
        regionData: []
    };

    partService.getParts().success(function(parts) {
        $scope.parts = parts;
    });

    templateService.getTemplateSources().success(function(templateSources) {
        $scope.templateSources = templateSources;
    });

    $scope.$watch('template.src', function(val) {

        if(val) {
            $log.debug('Fetching regions for template src: %s...', val);
            templateService.getTemplateRegions(val).success(function(regions) {
                $log.debug('Got regions: %s', regions);
                if(!$scope.template.regions.length) {
                    $scope.template.regions = regions.map(function(region) {
                        return {
                            name: region
                        };
                    });
                }

            }).error(function(err) {
                $scope.showError('Error getting template', err);
            });
        }
    });

    if(templateId) {
        $log.debug('Fetching template data for id: %s...', templateId);
        templateService.getTemplate(templateId).success(function(template) {
            $log.debug('Got template data:\n', JSON.stringify(template, null, '\t'));
            $scope.template = template;

            template.regions.map(function(region) {
                region.data = stringifyData(region.data);
                region.dataFromServer = !!region.data
                return region;
            });
        }).error(function(err) {
            $log.error(err, 'Error getting template');
            $scope.showError('Error getting template', err);
        });
    }

    $scope.addProperty = function() {
        $scope.template.properties.push({
            name: "",
            value: ""
        });
    };

    $scope.removeProperty = function(prop) {
        var index = $scope.template.properties.indexOf(prop);
        if (index > -1) {
            $scope.template.properties.splice(index, 1);
        }
    };

    $scope.addRegion = function() {
        var randTitle = Math.random().toString(36).substr(2,3);
        $scope.template.regions.push({
            name: randTitle
        });
    };

    $scope.removeRegion = function(region) {

        for(var i = $scope.template.regions.length - 1; i >= 0; i--) {
            if($scope.template.regions[i].name === region.name) {
                $scope.template.regions.splice(i, 1);
            }
        }
    };

    $scope.getTemplatePreviewUrl = function() {
        if($scope.template && $scope.template.src) {
            var templateSrc = encodeURIComponent($scope.template.src);
            var regionOutlineColor = encodeURIComponent(localStorage.getItem('sidebarColor'));
            var templatePreviewUrl = '/_templates/preview?templateSrc=' + templateSrc + '&regionOutlineColor=' + regionOutlineColor;
            $log.debug('Template preview url is: %s', templatePreviewUrl);
            return templatePreviewUrl;
        } else {
            return null;
        }

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

        //depopulate parts
        template.regions = template.regions.filter(function(region) {
            return typeof region === 'object';
        }).map(function(region) {
            if(region.part) {
                region.part = region.part._id;
            }
            if(isJson(region.data)) {
                region.data = JSON.parse(region.data);
            }
            return region;
        });

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
            templateService.deleteTemplate($scope.template._id).success(function (res) {
                $log.info('Template deleted');
                $location.path('/templates');
            }).error(function (err) {
                $log.error(err, 'Could not delete template');
                $scope.showError('Error deleting template', err);
            });
        }
    };

    function stringifyData(val) {
        return typeof val === 'object' ? JSON.stringify(val, null, 2) : val;
    }

    function isJson(str) {
        try {
            JSON.parse(str);
        } catch(e) {
            return false;
        }
        return true;
    }
});

})();
(function() {

/**
 *
 * @type {*}
 */
var adminApp = angular.module('adminApp');
adminApp.controller("TemplateListController", function($scope, $rootScope, $routeParams, $location, templateService) {

    $rootScope.pageTitle = "Templates";

    $scope.templates = [];

    templateService.doGetAvailableTemplates().success(function(templates) {
        $scope.templates = templates;
    }).error(function(err) {
        $scope.showError("Error getting templates", err);
    });

});

})();
(function() {
    var adminApp = angular.module('adminApp');
    adminApp.factory('templateService', function($http) {

        function TemplateService() {
            this.pageCache = [];
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
    adminApp.controller("UserController", function($scope, $rootScope, $location, $routeParams, $window, userService) {
        $rootScope.pageTitle = "User";

        var userId = $routeParams.userId;
        $scope.userId = userId;

        $scope.roles = [{
            name: "editor",
            label: "Editor"
        },{
            name: "developer",
            label: "Developer"
        },{
            name: "admin",
            label: "Admin"
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
            userService.deleteTemplate($scope.user._id).success(function (res) {
                console.log('User removed');
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
    adminApp.controller("UserListController", function($scope, $rootScope, $location, userService) {
        $rootScope.pageTitle = "Users";

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


