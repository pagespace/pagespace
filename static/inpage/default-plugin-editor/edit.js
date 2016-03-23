/* globals pagespace: false */

(function() {

    angular.module('defaultPluginApp', ['schemaForm']).controller('FormController', function($scope) {

        Promise.all([ pagespace.getData(), pagespace.getConfig() ]).then(function (result) {  // jshint ignore:line
            $scope.data = result[0];
            $scope.schema = result[1].schema;

            $scope.form = $scope.schema.form || [ '*' ];
            $scope.form.push({
                type: 'submit',
                title: 'Save and close'
            });

            $scope.$apply();
        });

        $scope.schema = {};
        $scope.data = {};
        $scope.form = [];

        $scope.onSubmit = function(form) {
            $scope.$broadcast('schemaFormValidate');

            if (form.$valid) {
                return pagespace.setData($scope.data).then(function () {
                    pagespace.close();
                });
            }
        };
    });
})();