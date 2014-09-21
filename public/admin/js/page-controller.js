(function() {

/**
 *
 * @type {*}
 */
var adminApp = angular.module('adminApp');
adminApp.controller("PageController", function($scope, $routeParams, $location, pageService, templateService) {

    var pageId = $routeParams.pageId;

    async.waterfall([
        function getTemplates(callback) {
            templateService.getTemplates().success(function(templates) {
               callback(null, templates)
            });
        },
        function getPage(templates, callback) {
            pageService.getPage(pageId).success(function(page) {
                $scope.templates = templates;
                $scope.page = page;
                callback();
            });
        }
    ], function(err) {
        if(err) {
            console.warn(err);
        }
    });

    $scope.updateUrl = function() {
        $scope.page.url = pageService.generateUrl($scope.page);
    };

    $scope.cancel = function() {
        $location.path("");
    };

    $scope.save = function() {

        var page = {
            name: $scope.page.name,
            url: $scope.page.url,
            template: $scope.page.template
        };
        pageService.updatePage(pageId, page).success(function(res) {
            console.log("Page saved");
            $location.path("");
        });
    };
});



})();