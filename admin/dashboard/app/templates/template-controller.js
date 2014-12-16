(function() {

/**
 *
 * @type {*}
 */
var adminApp = angular.module('adminApp');
adminApp.controller('TemplateController', function($scope, $rootScope, $routeParams, $location, $window, templateService) {

    $rootScope.pageTitle = 'Template';

    var templateId = $routeParams.templateId;
    $scope.templateId = templateId;

    $scope.selectedRegionIndex = 0;
    $scope.template = {
        properties: [],
        regions: [],
        regionData: []
    };

    if(templateId) {
        templateService.getTemplate(templateId).success(function(template) {
            $scope.template = template;
        }).error(function(err) {
            $rootScope.showError('Error getting template', err);
        });
    }

    $scope.addProperty = function() {
        $scope.template.properties.push({
            name: "",
            value: ""
        });
    };

    $scope.removeProperty = function(prop) {
        var index = $scope.template.properties.indexOf(prop);
        if (index > -1) {
            $scope.template.properties.splice(index, 1);
        }
    };

    $scope.addRegion = function() {
        var randTitle = Math.random().toString(36).substr(2,3);
        $scope.template.regions.push(randTitle);
    };

    $scope.removeRegion = function(region) {
        var index = $scope.template.regions.indexOf(region);
        if (index > -1) {
            $scope.template.regions.splice(index, 1);
        }
    };

    $scope.cancel = function() {
        $location.path('/templates');
    };

    $scope.save = function(form) {

        if(form.$invalid) {
            $window.scrollTo(0,0);
            $scope.submitted = true;
            return;
        }

        //remove any empty properties
        for(var i = $scope.template.properties.length - 1; i >= 0; i--) {
            var prop = $scope.template.properties[i];
            if(!prop.name) {
                $scope.template.properties.splice(i, 1);
            }
        }

        if(templateId) {
            templateService.updateTemplate(templateId, $scope.template).success(function() {
                $rootScope.showSuccess('Template updated.');
                $location.path('/templates');
            }).error(function(err) {
                $rootScope.showError('Error updating template', err);
            });
        } else {
            templateService.createTemplate($scope.template).success(function() {
                $rootScope.showSuccess('Template created.');
                $location.path('/templates');
            }).error(function(err) {
                $rootScope.showError('Error creating template', err);
            });
        }
    };

    $scope.remove = function() {
        templateService.deleteTemplate($scope.template._id).success(function (res) {
            console.log('Template deleted');
            $location.path('/templates');
        }).error(function(err) {
            $rootScope.showError('Error deleting template', err);
        });
    };
});

adminApp.directive('drawTemplate', function() {

    function link(scope, element, attrs) {

        var grid = 10;

        element.html('<canvas width="550" height="400"></canvas>');
        var canvas = new fabric.Canvas(element.find('canvas')[0]);
        canvas.backgroundColor = '#ddd';

        canvas.on('object:selected', function() {
            var obj = canvas.getActiveObject();
            canvas.bringToFront(obj);
        });

        canvas.on('object:moving', function(e){
            var obj = e.target;

            //keep in canvas bounds
            if(obj.top < 0 || obj.left < 0){
                obj.top = Math.max(obj.top, 0)
                obj.left = Math.max(obj.left , 0);
            }
            if(obj.left + obj.width > canvas.width || obj.top + obj.height > canvas.height) {
                obj.left = Math.min(obj.left, canvas.width - obj.width);
                obj.top = Math.min(obj.top, canvas.height - obj.height);
            }

            //snap to grid
            obj.set({
                left: Math.round(obj.left / grid) * grid,
                top: Math.round(obj.top / grid) * grid
            });
        });
        canvas.on('object:scaling', function(e) {
            var obj = e.target;

            //fix stroke scaling
            if(obj.item(0)) {
                var rect = obj.item(0);
                if(rect.getHeight() > rect.getWidth()) {
                    rect.strokeWidth = 1 / obj.scaleY;
                } else {
                    rect.strokeWidth = 1 / obj.scaleX;
                }
                rect.set('strokeWidth', rect.strokeWidth);
            }

            //stop text scaling
            if(obj.item(1)) {
                var text = obj.item(1);
                text.scaleX = 1 / obj.scaleX;
                text.scaleY = 1 / obj.scaleY;
            }
        });

        scope.$watch(attrs.regions, function(value) {

            canvas.clear();

            value.forEach(function(region, i) {

                var canvasData = scope.template.regionData[i] || {
                    top: 10,
                    left: 10,
                    width: 100,
                    height: 100
                };

                canvasData.stroke = '#000';
                canvasData.strokeWidth = 1;
                canvasData.fill = '#fff';
                var rect = new fabric.Rect(canvasData);
                var text = new fabric.Text(region, {
                    fontSize: 16,
                    fontFamily: 'Arial',
                    top: canvasData.top + 5,
                    left: canvasData.left + 5
                });

                var group = new fabric.Group([ rect, text ], {
                    left: canvasData.left,
                    top: canvasData.top,
                    hasRotatingPoint: false
                });

                group.on('modified', function() {
                    var regionData = {
                        top: this.top,
                        left: this.left,
                        width: this.getWidth(),
                        height: this.getHeight()
                    };
                    scope.template.regionData[i] = regionData;
                });
                group.on('selected', function() {
                    console.log(this)
                    scope.selectedRegionIndex = i;
                    scope.$apply();
                });
                canvas.add(group);
                canvas.sendToBack(group);
            });
        }, true);
    }

    return {
        //scope: '=canvasData',
        restrict: 'E',
        link: link
    };
});

})();