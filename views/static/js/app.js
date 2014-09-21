var adminApp = angular.module('adminApp', [
    'ngRoute',
    'ngResource'
]);

adminApp.config(['$routeProvider', function($routeProvider) {
    $routeProvider.
        when('/pages/:pageId', {
            templateUrl: '/app/static/partials/page.html',
            controller: 'pageController'
        }).
        when('/templates', {
            templateUrl: '/app/static/partials/template-list.html',
            controller: 'templateListController'
        }).
        when('/templates/new', {
            templateUrl: '/app/static/partials/template.html',
            controller: 'templateController'
        }).
        when('/templates/:templateId', {
            templateUrl: '/app/static/partials/template.html',
            controller: 'templateController'
        }).
        when('/parts/new', {
            templateUrl: '/app/static/partials/part.html',
            controller: 'partController'
        }).
        when('/parts/:partId', {
            templateUrl: '/app/static/partials/part.html',
            controller: 'partController'
        }).
        when('/parts', {
            templateUrl: '/app/static/partials/part-list.html',
            controller: 'partListController'
        }).
        otherwise({
            templateUrl: '/app/static/partials/site-map.html',
            controller: 'sitemapController'
        });
}]);