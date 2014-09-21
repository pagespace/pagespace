(function() {
    var adminApp = angular.module('adminApp');
    adminApp.factory('pageService', function($http) {

        function PageService() {
            this.pageCache = [];
        }
        PageService.prototype.getPages = function() {
            var self = this;
            var promise = $http.get('/_api/pages');
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


