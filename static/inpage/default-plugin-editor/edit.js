/* globals pagespace: false */

(function() {

    angular.module('defaultPluginApp', ['schemaForm']).controller('FormController', function($scope) {

        var ctrl = this;

        Promise.all([ pagespace.getData(), pagespace.getConfig() ]).then(function (result) {  // jshint ignore:line
            $scope.data = result[0];
            $scope.schema = result[1].schema;

            $scope.form = $scope.schema.form || [ '*' ];

            $scope.$apply();
        });

        $scope.schema = {};
        $scope.data = {};
        $scope.form = [];

        pagespace.on('save', function() {
            $scope.$broadcast('schemaFormValidate');

            if (ctrl.myForm.$valid) {
                return pagespace.setData($scope.data).then(function () {
                    pagespace.close();
                });
            }
        });
    });
})();