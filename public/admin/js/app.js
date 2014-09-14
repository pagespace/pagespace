var adminApp = angular.module('adminApp', [
    'ngRoute',
    'ngResource'
]);

adminApp.config(['$routeProvider', function($routeProvider) {
    $routeProvider.
        when('/page/:pageId', {
            templateUrl: '/public/admin/partials/page.html',
            controller: 'PageController'
        }).
        otherwise({
            templateUrl: '/public/admin/partials/site-map.html',
            controller: 'SitemapController'
        });
}]);