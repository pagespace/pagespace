(function() {

/**
 *
 * @type {*}
 */
var adminApp = angular.module('adminApp');
adminApp.controller("SitemapController", function($scope, $resource, $http) {

    var getPages = function() {
        $http.get('/_api/pages').success(function(allPages){

            var pageMap = {};
            allPages.forEach(function(page) {
                pageMap[page._id] = page;
            });

            var populateChildren = function(pages) {

                pages.forEach(function(currentPage) {

                    currentPage.children = allPages.filter(function(page) {
                        return currentPage._id === page.parent;
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
        });
    };

    getPages();

    $scope.addPage = function(parentPage) {

        var newPage = {
            name: "New Page"
        };
        if(parentPage) {
            newPage.parent = parentPage._id;
        } else {
            newPage.root = "primary";
        }

        $http.post('/_api/pages', newPage).success(function() {
            console.log("Page added");
            getPages();
        });
    };

    $scope.removePage = function(page) {

        var update = {
            ready: false
        };
        $http.deleputte('/_api/pages/' + page._id, update).success(function() {
            console.log("Page deactivated");
            getPages();
        });
    };
});

})();