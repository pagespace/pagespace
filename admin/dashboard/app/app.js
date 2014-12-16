(function() {
    var adminApp = angular.module('adminApp', [
        'ngRoute',
        'ngResource',
        'angular-carousel'
    ]);

    adminApp.config(['$routeProvider', function($routeProvider) {
        $routeProvider.

            //pages
            when('/pages/:pageId', {
                templateUrl: '/_static/dashboard/app/pages/page.html',
                controller: 'PageController'
            }).
            when('/pages/new', {
                templateUrl: '/_static/dashboard/app/pages/page.html',
                controller: 'PageController'
            }).
            when('/pages/new/:parentPageId', {
                templateUrl: '_/static/dashboard/app/pages/page.html',
                controller: 'PageController'
            }).
            when('/pages/delete/:pageId', {
                templateUrl: '_/static/dashboard/app/pages/delete-page.html',
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
