angular.module('editApp')
.directive('ckedit', function ($parse) {

    //from https://github.com/ericpanorel/AngularCkEdDirective
    CKEDITOR.disableAutoInline = true;
    var counter = 0,
        prefix = '__ckd_';

    return {
        restrict: 'A',
        link: function (scope, element, attrs, controller) {
            var getter = $parse(attrs.ckedit),
                setter = getter.assign;

            attrs.$set('contenteditable', true); // inline ckeditor needs this

            var options = {};
            options.on = {
                blur: function (e) {
                    if (e.editor.checkDirty()) {
                        var ckValue = e.editor.getData();
                        scope.$apply(function () {
                            setter(scope, ckValue);
                        });
                        ckValue = null;
                        e.editor.resetDirty();
                    }
                }
            };
            options.extraPlugins = 'sourcedialog';
            options.removePlugins = 'sourcearea';
            var editorangular = CKEDITOR.inline(element[0], options); //invoke
        }
    }

})
.controller("htmlDocController" , function($scope, $http) {
    $scope.save = function() {

        var htmlVal = CKEDITOR.instances['ck' + $scope.partInstanceId].getData();
        $http.put('/_api/part-instances/' + $scope.partInstanceId, {
            data: htmlVal
        });
    };
});