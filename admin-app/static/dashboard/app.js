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

            //pages
            when('/pages/:pageId', {
                templateUrl:  _appRoot + '/static/dashboard/pages/page.html',
                controller: 'PageController'
            }).

            //parts
            when('/parts', {
                templateUrl:  _appRoot + '/static/dashboard/parts/part-list.html',
                controller: 'PartListController'
            }).
            when('/parts/new', {
                templateUrl:  _appRoot + '/static/dashboard/parts/part.html',
                controller: 'PartController'
            }).
            when('/parts/:partId', {
                templateUrl:  _appRoot + '/static/dashboard/parts/part.html',
                controller: 'PartController'
            }).


            //publishing
            when('/publishing', {
                templateUrl:  _appRoot + '/static/dashboard/publishing/publishing.html',
                controller: 'PublishingController'
            }).

            //media
            when('/media', {
                templateUrl:  _appRoot + '/static/dashboard/media/media.html',
                controller: 'MediaController'
            }).
            when('/media/upload', {
                templateUrl:  _appRoot + '/static/dashboard/media/media-upload.html',
                controller: 'MediaUploadController'
            }).
            when('/media/:mediaId', {
                templateUrl:  _appRoot + '/static/dashboard/media/media-item.html',
                controller: 'MediaItemController'
            }).

            //macros
            when('/macros', {
                templateUrl:  _appRoot + '/static/dashboard/macros/macros.html',
                controller: 'MacrosController'
            }).

            //templates
            when('/templates', {
                templateUrl:  _appRoot + '/static/dashboard/templates/template-list.html',
                controller: 'TemplateListController'
            }).
            when('/templates/new', {
                templateUrl:  _appRoot + '/static/dashboard/templates/template.html',
                controller: 'TemplateController'
            }).
            when('/templates/:templateId', {
                templateUrl:  _appRoot + '/static/dashboard/templates/template.html',
                controller: 'TemplateController'
            }).

            //users
            when('/users', {
                templateUrl:  _appRoot + '/static/dashboard/users/user-list.html',
                controller: 'UserListController'
            }).
            when('/users/new', {
                templateUrl:  _appRoot + '/static/dashboard/users/user.html',
                controller: 'UserController'
            }).
            when('/users/:userId', {
                templateUrl:  _appRoot + '/static/dashboard/users/user.html',
                controller: 'UserController'
            }).

            //default to sitemap
            otherwise({
                templateUrl:  _appRoot +'/static/dashboard/pages/site-map.html',
                controller: 'SitemapController'
            });
    }]);
})();
