(function() {
    var adminApp = angular.module('adminApp');
    adminApp.directive('bsHasError', function() {
        return {
            restrict: "A",
            link: function(scope, element, attrs, ctrl) {
                //find parent form
                function getClosestFormName(element) {
                    var parent = element.parent();
                    if(parent[0].tagName.toLowerCase() === 'form') {
                        return parent.attr('name') || null;
                    } else {
                        return getClosestFormName(parent);
                    }
                }
                var formName = getClosestFormName(element);
                var fieldName = attrs.bsHasError;

                if(formName && fieldName) {
                    var field = scope[formName][fieldName];
                    if(field) {
                        scope.$watch(function() {
                            element.toggleClass('has-error', field.$invalid && (field.$dirty || !!scope.submitted));
                            element.toggleClass('has-success', field.$valid && field.$dirty);
                        });
                    }
                }
            }
        };
    });
})();

