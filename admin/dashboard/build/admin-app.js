(function() {
    var adminApp = angular.module('adminApp', [
        'ngRoute',
        'ngResource',
        'angular-carousel',
        'ui.codemirror'
    ]);

    adminApp.config(['$routeProvider', function($routeProvider) {
        $routeProvider.

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

            //site
            when('/site', {
                templateUrl: '/_static/dashboard/app/site/sitesettings.html',
                controller: 'SiteSettingsController'
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
    }]);
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

    $scope.showItem = function(item) {
        $location.path('/media/' + item._id);
    };

    mediaService.getItems().success(function(items) {
        $scope.mediaItems = items;
    }).error(function(err) {
        $rootScope.showError("Error getting media items", err);
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
                    $rootScope.showInfo("Media: " + item.name + " removed.");
                }).error(function(err) {
                    $rootScope.showError("Error deleting page", err);
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
            $rootScope.showError('Error getting media item', err);
        });

        $scope.updateItemText = function() {
            mediaService.updateItemText($scope.item, $scope.itemText).success(function() {
                $rootScope.showSuccess('Media item updated');
                $location.path('/media');
            }).error(function(err) {
                $rootScope.showError('Could not update text media', err);
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
adminApp.controller('MediaUploadController', function($scope, $rootScope, $location, $http, $window, mediaService) {
    $rootScope.pageTitle = 'Upload new media';

    $scope.media = {};

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
           tags: $scope.media.tags
        }).success(function() {
            $location.path('/media');
            $rootScope.showSuccess('Upload successful');
        }).error(function(err) {
            $rootScope.showError('Error uploading file', err);
        });
        $rootScope.showInfo('Upload in progress...');
    };
});

})();
(function() {

/**
 *
 * @type {*}
 */
var adminApp = angular.module('adminApp');
adminApp.controller("notificationsController", function($scope, $rootScope) {
    $scope.message = null;

    function showMessage(text, type) {
        $scope.message = {
            type: type,
            text: text
        };

    }

    $rootScope.showSuccess = function(text) {
        console.log(text);
        showMessage(text, 'success');
    };

    $rootScope.showInfo = function(text) {
        console.log(text);
        showMessage(text, 'info');
    };

    $rootScope.showWarning = function(text) {
        console.warn(text);
        showMessage(text, 'warning');
    };

    $rootScope.showError = function(text, err) {
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

    $rootScope.clearNotification = function() {
        $scope.message = null;
    };
    $scope.clear = function() {
        $scope.message = null;
    };
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

    $rootScope.pageTitle = "Delete page";

    var pageId = $routeParams.pageId;
    $scope.status = 410;

    pageService.getPage(pageId).success(function(page) {
        $scope.page = page;

        //default delete status
        page.status = 410;
    }).error(function(err) {
        $rootScope.showError('Couldn\'t find a page to delete', err);
    });
    pageService.getPages().success(function(pages) {
        $scope.pages = pages;
    }).error(function(err) {
        $rootScope.showError('Couldn\'t get pages', err);
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
            $rootScope.showInfo("Page: " + page.name + " removed.");
        }).error(function(err) {
            $rootScope.showError("Error deleting page", err);
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
    function($scope, $rootScope, $routeParams, $location, $timeout,
             pageService, templateService, partService, $window) {

    $rootScope.clearNotification();
    $rootScope.pageTitle = "Page";

    var pageId = $routeParams.pageId;
    var parentPageId = $routeParams.parentPageId;
    var order = $routeParams.order;

    //sets the code mirror mode for editing raw part data
    $scope.editorOpts = {
        mode: 'application/json'
    };
    $scope.selectedRegionIndex = -1;
    $scope.selectedTemplateIndex = 0;
    $scope.template = null;

    var getPageFunctions = [];
    getPageFunctions.push(function getTemplates(callback) {
        templateService.getTemplates().success(function(templates) {
            $scope.templates = templates;
            callback()
        });
    });
    getPageFunctions.push(function getParts(callback) {
        partService.getParts().success(function(parts) {
            $scope.parts = parts;
            callback()
        });
    });
    if(pageId) {
        $scope.pageId = pageId;
        getPageFunctions.push(function getPage(callback) {
            pageService.getPage(pageId).success(function(page) {
                $scope.page = page;

                page.expiresAt = new Date(page.expiresAt);

                $scope.template = $scope.templates.filter(function(template) {
                    return page.template && page.template._id === template._id;
                })[0] || null;

                page.regions.map(function(region) {
                    region.data = stringifyData(region.data);
                    region.dataFromServer = !!region.data
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
            getPageFunctions.push(function getParentPage(callback) {
                pageService.getPage(parentPageId).success(function(page) {
                    $scope.page.parent = page;
                    callback();
                });
            });
        } else {
            $scope.page.root = 'primary';
        }
    }

    async.series(getPageFunctions, function(err) {
        if(err) {
            $rootScope.showError(err);
        }
    });

    $scope.updateUrl = function() {
        $scope.page.url = pageService.generateUrl($scope.page);
    };

    $scope.cancel = function() {
        $location.path("");
    };

    $scope.selectTemplate = function(template) {
        $scope.template = template;

        template.regions.forEach(function(region) {
           $scope.page.regions.push({
               name: region

           });
        });
    };

    $scope.$watch('page.name', function() {
        if($scope.pageForm.url.$pristine && !pageId) {
            $scope.updateUrl();
        }
    });

    $scope.setDefaultPartData = function() {
        //this will check all parts that have not had data explicitly set and set the default part data
        //for the selected part
        $scope.page.regions.forEach(function(region, index) {
            var dataField = $scope.pageForm['regiondata_' + index];
            if(region.part && dataField.$pristine && !region.dataFromServer) {
                region.data = region.part.defaultData || "";
            }
        });
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

        //unpopulate
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
            pageService.updatePage(pageId, page).success(function(res) {
                $rootScope.showSuccess("Page: " + page.name + " saved.");
                $location.path("");
            }).error(function(err) {
                $rootScope.showError("Error saving page", err);
            });
        } else {
            pageService.createPage($scope.page).success(function() {
                $rootScope.showSuccess("Page: " + page.name + " created.");
                $location.path("");
            }).error(function(err) {
                $rootScope.showError("Error adding new page", err);
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

adminApp.directive('viewTemplate', function() {

    function link(scope, element, attrs) {
        element.html('<canvas width="550" height="400"></canvas>');
        var canvas = new fabric.Canvas(element.find('canvas')[0]);
        canvas.backgroundColor = '#ddd';

        scope.template.regions.forEach(function(region, i) {

            var canvasData = scope.template.regionData[i];

            if(canvasData) {
                canvasData.stroke = '#000';
                canvasData.strokeWidth = 1;
                canvasData.fill = '#fff';
                var rect = new fabric.Rect(canvasData);
                var text = new fabric.Text(region, {
                    fontSize: 16,
                    fontFamily: 'Arial',
                    top: canvasData.top + 5,
                    left: canvasData.left + 5
                });

                var group = new fabric.Group([ rect, text ], {
                    left: canvasData.left,
                    top: canvasData.top,
                    hasControls: false,
                    lockMovementX: true,
                    lockMovementY: true
                });
                group.on('selected', function() {
                    scope.selectedRegionIndex = i;
                    scope.$apply();
                });
                canvas.add(group);
                canvas.sendToBack(group);
            }
        });
    }

    return {
        //scope: '=canvasData',
        restrict: 'E',
        link: link
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

    var getSite = function() {
        siteService.getSite().success(function(site) {
            $scope.site = site;
        }).error(function(err) {
            $rootScope.showError("Error getting site", err);
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
            $rootScope.showError("Error getting pages", err);
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
        $rootScope.showInfo('Preparing new page...');
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
            $rootScope.showError('Unable to determine order of new page', err);
        });
    };

    $scope.removePage = function(page) {

        $location.path('/pages/delete/' + page._id);
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
            $rootScope.showError("Error getting part", err);
        });
    }

    $scope.reset = function() {
        partService.resetPart($scope.part).success(function() {
            $rootScope.showSuccess("Cache cleared");
        }).error(function(err) {
            $rootScope.showError("Error getting part", err);
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
                $rootScope.showSuccess("Part updated.");
                $location.path("/parts");
            }).error(function(err) {
                $rootScope.showError("Error updating part", err);
            });
        } else {
            partService.createPart($scope.part).success(function(res) {
                console.log("Part created");
                $rootScope.showSuccess("Part created.");
                $location.path("/parts");
            }).error(function(err) {
                $rootScope.showError("Error saving part", err);
            });
        }
    };

    $scope.remove = function() {
        partService.deletePart($scope.part._id).success(function (res) {
            $rootScope.showInfo("Part removed", err);
            $location.path("/parts");
        }).error(function(err) {
            $rootScope.showError("Error deleting part", err);
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
adminApp.controller('PartListController', function($scope, $rootScope, $routeParams, $location, partService) {

    $rootScope.pageTitle = "Page Parts";

    $scope.parts = [];

    partService.getParts().success(function(parts) {
        $scope.parts = parts;
    }).error(function(err) {
        $rootScope.showError("Error getting parts", err);
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
    $rootScope.pageTitle = 'Publishing';

    //get all pages with drafts
    publishingService.getDrafts().success(function(drafts) {
        $scope.drafts = drafts;
    }).error(function(err) {
        $rootScope.showError('Error getting drafts to publish', err);
    });

    $scope.cancel = function() {
        $location.path('/');
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
            $rootScope.showSuccess('Publishing successful');
            $location.path('/');
        }).error(function(err) {
            $rootScope.showError('Error performing publish', err);
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
        $rootScope.pageTitle = "Site settings";

        $scope.defaultPage = null;

        siteService.getSite().success(function(site) {
            $scope.site = site;
        });

        pageService.getPages().success(function(pages) {
            $scope.pages = pages;
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
                    $rootScope.showError('Unable to set default page', err);
                });
            }

            siteService.updateSite(site).success(function() {
                $rootScope.showSuccess('Site updated.');
                $location.path('/');
            }).error(function(err) {
                $rootScope.showError('Error updating site', err);
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
adminApp.controller('TemplateController', function($scope, $rootScope, $routeParams, $location, $window, templateService) {

    $rootScope.pageTitle = 'Template';

    var templateId = $routeParams.templateId;
    $scope.templateId = templateId;

    $scope.selectedRegionIndex = 0;
    $scope.template = {
        properties: [],
        regions: [],
        regionData: []
    };

    if(templateId) {
        templateService.getTemplate(templateId).success(function(template) {
            $scope.template = template;
        }).error(function(err) {
            $rootScope.showError('Error getting template', err);
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
        $scope.template.regions.push(randTitle);
    };

    $scope.removeRegion = function(region) {
        var index = $scope.template.regions.indexOf(region);
        if (index > -1) {
            $scope.template.regions.splice(index, 1);
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

        //remove any empty properties
        for(var i = $scope.template.properties.length - 1; i >= 0; i--) {
            var prop = $scope.template.properties[i];
            if(!prop.name) {
                $scope.template.properties.splice(i, 1);
            }
        }

        if(templateId) {
            templateService.updateTemplate(templateId, $scope.template).success(function() {
                $rootScope.showSuccess('Template updated.');
                $location.path('/templates');
            }).error(function(err) {
                $rootScope.showError('Error updating template', err);
            });
        } else {
            templateService.createTemplate($scope.template).success(function() {
                $rootScope.showSuccess('Template created.');
                $location.path('/templates');
            }).error(function(err) {
                $rootScope.showError('Error creating template', err);
            });
        }
    };

    $scope.remove = function() {
        templateService.deleteTemplate($scope.template._id).success(function (res) {
            console.log('Template deleted');
            $location.path('/templates');
        }).error(function(err) {
            $rootScope.showError('Error deleting template', err);
        });
    };
});

adminApp.directive('drawTemplate', function() {

    function link(scope, element, attrs) {

        var grid = 10;

        element.html('<canvas width="550" height="400"></canvas>');
        var canvas = new fabric.Canvas(element.find('canvas')[0]);
        canvas.backgroundColor = '#ddd';

        canvas.on('object:selected', function() {
            var obj = canvas.getActiveObject();
            canvas.bringToFront(obj);
        });

        canvas.on('object:moving', function(e){
            var obj = e.target;

            //keep in canvas bounds
            if(obj.top < 0 || obj.left < 0){
                obj.top = Math.max(obj.top, 0)
                obj.left = Math.max(obj.left , 0);
            }
            if(obj.left + obj.width > canvas.width || obj.top + obj.height > canvas.height) {
                obj.left = Math.min(obj.left, canvas.width - obj.width);
                obj.top = Math.min(obj.top, canvas.height - obj.height);
            }

            //snap to grid
            obj.set({
                left: Math.round(obj.left / grid) * grid,
                top: Math.round(obj.top / grid) * grid
            });
        });
        canvas.on('object:scaling', function(e) {
            var obj = e.target;

            //fix stroke scaling
            if(obj.item(0)) {
                var rect = obj.item(0);
                if(rect.getHeight() > rect.getWidth()) {
                    rect.strokeWidth = 1 / obj.scaleY;
                } else {
                    rect.strokeWidth = 1 / obj.scaleX;
                }
                rect.set('strokeWidth', rect.strokeWidth);
            }

            //stop text scaling
            if(obj.item(1)) {
                var text = obj.item(1);
                text.scaleX = 1 / obj.scaleX;
                text.scaleY = 1 / obj.scaleY;
            }
        });

        scope.$watch(attrs.regions, function(value) {

            canvas.clear();

            value.forEach(function(region, i) {

                var canvasData = scope.template.regionData[i] || {
                    top: 10,
                    left: 10,
                    width: 100,
                    height: 100
                };

                canvasData.stroke = '#000';
                canvasData.strokeWidth = 1;
                canvasData.fill = '#fff';
                var rect = new fabric.Rect(canvasData);
                var text = new fabric.Text(region, {
                    fontSize: 16,
                    fontFamily: 'Arial',
                    top: canvasData.top + 5,
                    left: canvasData.left + 5
                });

                var group = new fabric.Group([ rect, text ], {
                    left: canvasData.left,
                    top: canvasData.top,
                    hasRotatingPoint: false
                });

                group.on('modified', function() {
                    var regionData = {
                        top: this.top,
                        left: this.left,
                        width: this.getWidth(),
                        height: this.getHeight()
                    };
                    scope.template.regionData[i] = regionData;
                });
                group.on('selected', function() {
                    console.log(this)
                    scope.selectedRegionIndex = i;
                    scope.$apply();
                });
                canvas.add(group);
                canvas.sendToBack(group);
            });
        }, true);
    }

    return {
        //scope: '=canvasData',
        restrict: 'E',
        link: link
    };
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

    templateService.getTemplates().success(function(templates) {
        $scope.templates = templates;
    }).error(function(err) {
        $rootScope.showError("Error getting templates", err);
    });

});

})();
(function() {
    var adminApp = angular.module('adminApp');
    adminApp.factory('templateService', function($http) {

        function TemplateService() {
            this.pageCache = [];
        }
        TemplateService.prototype.getTemplates = function() {
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
                    $rootScope.showSuccess('User updated.');
                    $location.path('/users');
                }).error(function(err) {
                    $rootScope.showError('Error updating user', err);
                });
            } else {
                userService.createUser(user).success(function() {
                    $rootScope.showSuccess('User created.');
                    $location.path('/users');
                }).error(function(err) {
                    $rootScope.showError('Error creating user', err);
                });
            }
        };

        $scope.remove = function() {
            userService.deleteTemplate($scope.user._id).success(function (res) {
                console.log('User removed');
                $location.path('/templates');
            }).error(function(err) {
                $rootScope.showError('Error deleting template', err);
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


