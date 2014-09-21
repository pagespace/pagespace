var adminApp = angular.module('adminApp', [
    'ngRoute',
    'ngResource'
]);

adminApp.config(['$routeProvider', function($routeProvider) {
    $routeProvider.
        when('/pages/:pageId', {
            templateUrl: '/public/admin/partials/page.html',
            controller: 'PageController'
        }).
        when('/templates', {
            templateUrl: '/public/admin/partials/template-list.html',
            controller: 'TemplateListController'
        }).
        when('/templates/new', {
            templateUrl: '/public/admin/partials/template.html',
            controller: 'TemplateController'
        }).
        when('/templates/:templateId', {
            templateUrl: '/public/admin/partials/template.html',
            controller: 'TemplateController'
        }).
        when('/parts/:partId', {
            templateUrl: '/public/admin/partials/part.html',
            controller: 'PartController'
        }).
        when('/parts', {
            templateUrl: '/public/admin/partials/parts.html',
            controller: 'PartController'
        }).
        otherwise({
            templateUrl: '/public/admin/partials/site-map.html',
            controller: 'SitemapController'
        });
}]);