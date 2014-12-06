(function() {
    var _appRoot = window._appRoot;
    var adminApp = angular.module('adminApp', [
        'ngRoute',
        'ngResource',
        'angular-carousel'
    ]);
    adminApp.value('powerMode', window._powerMode);

    adminApp.config(['$routeProvider', function($routeProvider) {
        $routeProvider.
            when('/pages/:pageId', {
                templateUrl:  _appRoot + '/static/partials/page.html',
                controller: 'pageController'
            }).
            when('/templates', {
                templateUrl:  _appRoot + '/static/partials/template-list.html',
                controller: 'templateListController'
            }).
            when('/templates/new', {
                templateUrl:  _appRoot + '/static/partials/template.html',
                controller: 'templateController'
            }).
            when('/templates/:templateId', {
                templateUrl:  _appRoot + '/static/partials/template.html',
                controller: 'templateController'
            }).
            when('/parts/new', {
                templateUrl:  _appRoot + '/static/partials/part.html',
                controller: 'partController'
            }).
            when('/parts/:partId', {
                templateUrl:  _appRoot + '/static/partials/part.html',
                controller: 'partController'
            }).
            when('/parts', {
                templateUrl:  _appRoot + '/static/partials/part-list.html',
                controller: 'partListController'
            }).
            when('/publishing', {
                templateUrl:  _appRoot + '/static/partials/publishing.html',
                controller: 'publishingController'
            }).
            when('/media', {
                templateUrl:  _appRoot + '/static/partials/media.html',
                controller: 'mediaController'
            }).
            when('/media/upload', {
                templateUrl:  _appRoot + '/static/partials/media-upload.html',
                controller: 'mediaUploadController'
            }).
            when('/media/:mediaId', {
                templateUrl:  _appRoot + '/static/partials/media-item.html',
                controller: 'mediaItemController'
            }).
            when('/macros', {
                templateUrl:  _appRoot + '/static/partials/macros.html',
                controller: 'macrosController'
            }).
            otherwise({
                templateUrl:  _appRoot +'/static/partials/site-map.html',
                controller: 'sitemapController'
            });
    }]);
})();

(function() {

    /**
     *
     * @type {*}
     */
    var adminApp = angular.module('adminApp');
    adminApp.controller("macrosController", function($scope, $rootScope, $routeParams, $location, templateService) {
        $rootScope.pageTitle = "Macros";
    });

})();

(function() {

/**
 *
 * @type {*}
 */
var adminApp = angular.module('adminApp');
adminApp.controller('mediaController', function($scope, $rootScope, $location, mediaService) {
    $rootScope.pageTitle = 'Media';

    $scope.isImage = mediaService.isImage;

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

        MediaService.prototype.createItem = function(mediaData) {
            return $http.post('/_api/media', mediaData);
        };

        MediaService.prototype.deleteItem = function(mediaId) {
            return $http.delete('/_api/media/' + mediaId);
        };

        MediaService.prototype.isImage = function(item) {
            return item && !!item.type.match(/image\/[jpeg|png|gif]/);
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

        return new MediaService();
    });

})();




(function() {

    /**
     *
     * @type {*}
     */
    var adminApp = angular.module('adminApp');
    adminApp.controller('mediaItemController', function($scope, $rootScope, $location, $routeParams, mediaService) {
        $rootScope.pageTitle = 'Media';

        $scope.isImage = mediaService.isImage;

        var mediaId = $routeParams.mediaId;

        mediaService.getItem(mediaId).success(function(item) {
            $scope.item = item;
        }).error(function(err) {
            $rootScope.showError("Error getting media item", err);
        });
    });

})();

(function() {

/**
 *
 * @type {*}
 */
var adminApp = angular.module('adminApp');
adminApp.controller('mediaUploadController', function($scope, $rootScope, $http, mediaService) {
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

    $scope.upload = function() {

        mediaService.uploadItem($scope.media.file, {
           name: $scope.media.name,
           description: $scope.media.description,
           tags: $scope.media.tags
        }).success(function() {
            $rootScope.showSuccess('Upload successful');
            $location.path('/media');
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
        showMessage(text + ": " + err, 'danger');
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
adminApp.controller("pageController",
    function($scope, $rootScope, $routeParams, $location, $timeout,
             pageService, templateService, partService, powerMode) {

    $rootScope.pageTitle = "Page";

    var pageId = $routeParams.pageId;

    $scope.powerMode = true;

    $scope.selectedRegionIndex = -1;
    $scope.selectedTemplateIndex = 0;
    $scope.template = null;

    async.series([
        function getTemplates(callback) {
            templateService.getTemplates().success(function(templates) {
                $scope.templates = templates;
                callback()
            });
        },
        function getParts(callback) {
            partService.getParts().success(function(parts) {
                $scope.parts = parts;
                callback()
            });
        },
        function getPage(callback) {
            pageService.getPage(pageId).success(function(page) {
                $scope.page = page;

                $scope.template = $scope.templates.filter(function(template) {
                    return page.template && page.template._id === template._id;
                })[0] || null;

                callback();
            });
        }
    ], function(err) {
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

    $scope.save = function() {
        var page = $scope.page;

        //unpopulate
        page.template = $scope.template._id;
        if(page.parent) {
            page.parent = page.parent._id;
        }
        page.regions = page.regions.filter(function(val) {
            return typeof val === 'object';
        }).map(function(val) {
            if(val.part) {
                val.part = val.part._id;
            }
            return val;
        });
        pageService.updatePage(pageId, page).success(function(res) {
            $rootScope.showSuccess("Page: " + page.name + " saved.");
            $location.path("");
        }).error(function(err) {
            $rootScope.showError("Error saving page", err);
        });
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

        PageService.prototype.createPage = function(pageData, parent) {

            pageData = pageData || {};

            pageData.name = pageData.name || getNewPageName(this.pageCache);

            if(typeof parent === "string") {
                pageData.root = parent;
            } else if(parent && parent._id){
                pageData.parent = parent._id;
            }

            if(!pageData.url) {
                pageData.url = this.generateUrl(pageData, parent);
            }

            return $http.post('/_api/pages', pageData);
        };

        PageService.prototype.deletePage = function(pageId) {
            return $http.delete('/_api/pages/' + pageId);
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
adminApp.controller("partController", function($scope, $rootScope, $routeParams, $location, partService) {

    $rootScope.pageTitle = "Page Part";

    var partId = $routeParams.partId;

    $scope.part = {};

    if(partId) {
        partService.getPart(partId).success(function(part) {
            $scope.part = part;
        }).error(function(err) {
            $rootScope.showError("Error getting part", err);
        });
    }

    $scope.cancel = function() {
        $location.path("/parts");
    };

    $scope.save = function() {
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
            console.log("Part removed");
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
adminApp.controller('partListController', function($scope, $rootScope, $routeParams, $location, partService) {

    $rootScope.pageTitle = "Page Part";

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


        return new PartService();
    });

})();



(function() {

/**
 *
 * @type {*}
 */
var adminApp = angular.module('adminApp');
adminApp.controller('publishingController', function($scope, $rootScope, $routeParams, $location, publishingService) {
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

/**
 *
 * @type {*}
 */
var adminApp = angular.module('adminApp');
adminApp.controller("sitemapController", function($scope, $rootScope, $location, pageService) {

    $rootScope.pageTitle = "Sitemap";

    var getPages = function() {
        pageService.getPages().success(function(allPages){

            var pageMap = {};
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

    getPages();

    $scope.addPage = function(parentPage) {

        parentPage = parentPage || 'primary';
        pageService.createPage(null, parentPage).success(function() {
            getPages();
        }).error(function(err) {
            $rootScope.showError("Error adding new page", err);
        });
    };

    $scope.removePage = function(page) {

        var really = window.confirm('Really delete the page, ' + page.name + '?');
        if(really) {
            pageService.deletePage(page._id).success(function() {
                getPages();
                $rootScope.showInfo("Page: " + page.name + " removed.");
            }).error(function(err) {
                $rootScope.showError("Error deleting page", err);
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
adminApp.controller('templateController', function($scope, $rootScope, $routeParams, $location, templateService) {

    $rootScope.pageTitle = 'Template';

    var templateId = $routeParams.templateId;

    $scope.selectedRegionIndex = 0;
    $scope.template = {
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

    $scope.save = function() {
        if(templateId) {
            templateService.updateTemplate(templateId, $scope.template).success(function(res) {
                $rootScope.showSuccess('Template updated.');
                $location.path('/templates');
            }).error(function(err) {
                $rootScope.showError('Error updating template', err);
            });
        } else {
            templateService.createTemplate($scope.template).success(function(res) {
                $rootScope.showSuccess('Template created.');
                $location.path('/templates');
            }).error(function(err) {
                $rootScope.showError('Error creating template', err);
            });
        }
    };

    $scope.remove = function() {
        templateService.deleteTemplate($scope.template._id).success(function (res) {
            console.log('Template saved');
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
adminApp.controller("templateListController", function($scope, $rootScope, $routeParams, $location, templateService) {

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

        TemplateService.prototype.deleteTemplate = function(templateId) {
            return $http.delete('/_api/templates/' + templateId);
        };

        TemplateService.prototype.updateTemplate = function(templateId, templateData) {
            return $http.put('/_api/templates/' + templateId, templateData);
        };


        return new TemplateService();
    });

})();


