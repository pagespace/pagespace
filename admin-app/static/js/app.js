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
                templateUrl:  _appRoot +'/static/partials/page.html',
                controller: 'pageController'
            }).
            when('/templates', {
                templateUrl:  _appRoot +'/static/partials/template-list.html',
                controller: 'templateListController'
            }).
            when('/templates/new', {
                templateUrl:  _appRoot +'/static/partials/template.html',
                controller: 'templateController'
            }).
            when('/templates/:templateId', {
                templateUrl:  _appRoot +'/app/static/partials/template.html',
                controller: 'templateController'
            }).
            when('/parts/new', {
                templateUrl:  _appRoot +'/static/partials/part.html',
                controller: 'partController'
            }).
            when('/parts/:partId', {
                templateUrl:  _appRoot +'/static/partials/part.html',
                controller: 'partController'
            }).
            when('/parts', {
                templateUrl:  _appRoot +'/static/partials/part-list.html',
                controller: 'partListController'
            }).
            otherwise({
                templateUrl:  _appRoot +'/static/partials/site-map.html',
                controller: 'sitemapController'
            });
    }]);
})();
