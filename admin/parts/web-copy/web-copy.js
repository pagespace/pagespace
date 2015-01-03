angular.module('webCopyApp', [])
.directive('psWysihtml', function () {

    return {
        restrict: 'A',
        link: function (scope, element, attrs, controller) {

            var editorEl = element[0].querySelector('.editor');
            var sourceEl = element[0].querySelector('.source');
            var toolbarEl = element[0].querySelector('.toolbar');

            angular.element(sourceEl).addClass('hidden');

            var editor = new wysihtml5.Editor(editorEl, {
                toolbar: toolbarEl,
                showToolbarAfterInit: false,
                parserRules:  wysihtml5ParserRules,
                cleanUp: false,
                useLineBreaks:  false
            });
            scope.webcopy = editor.getValue();

            element[0].querySelector('[data-behavior=showSource]').addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                var textarea = sourceEl.getElementsByTagName('textarea')[0];
                var html;
                if(angular.element(sourceEl).hasClass('hidden')) {
                    //show textarea
                    html = editor.getValue();
                    angular.element(textarea).val(html);
                } else {
                    // show editor
                    html = angular.element(textarea).val();
                    editor.setValue(html);
                }

                angular.element(editorEl).toggleClass('hidden');
                angular.element(sourceEl).toggleClass('hidden');
            });

            editor.on("focus", function() {
                angular.element(toolbarEl).removeClass('hidden');
            });
/*            editor.on("blur", function() {
                angular.element(toolbarEl).addClass('hidden');
            });*/
            editor.on("interaction", function() {
                scope.webcopy = editor.getValue();
            });
            editor.on("change", function() {
                scope.changed = true;
                scope.$apply();
            });

        }
    }
})
.controller('WebCopyController' , function($scope, $http) {
    $scope.changed = false;
    $scope.save = function() {
        var htmlVal = $scope.webcopy;
        $http.put('/_data/' + $scope.pageId + '/' + $scope.region, {
            data: htmlVal
        }).success(function() {
            $scope.changed = false;
        });
    };
});