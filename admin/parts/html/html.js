angular.module('htmlApp', [])
.controller('HtmlController' , function($scope, $http) {
    $scope.save = function() {
        $http.put('/_data/' + $scope.pageId + '/' + $scope.region, {
            data: $scope.html
        });
    };
});