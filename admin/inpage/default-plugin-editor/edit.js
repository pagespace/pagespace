/* globals pagespace: false */

(function() {
    angular.module('defaultPluginApp', [])
    .controller('DefaultPluginController' , function($scope) {

        Promise.all([ pagespace.getData(), pagespace.getConfig() ]).then(function (result) {  // jshint ignore:line
            $scope.data = result[0];
            $scope.schema = result[1].schema;
            $scope.$apply();
        });

        $scope.save = function () {
            return pagespace.setData($scope.data).then(function () {
                pagespace.close();
            });
        };
    });
})();