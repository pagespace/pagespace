(function() {

/**
 *
 * @type {*}
 */
var adminApp = angular.module('adminApp');
adminApp.controller('TemplateController', function($scope, $rootScope, $routeParams, $location, $window,
                                                   templateService, partService) {

    $rootScope.pageTitle = 'Template';

    var templateId = $routeParams.templateId;
    $scope.templateId = templateId;

    $scope.selectedRegionIndex = 0;
    $scope.template = {
        properties: [],
        regions: [],
        regionData: []
    };

    partService.getParts().success(function(parts) {
        $scope.parts = parts;
    });

    templateService.getTemplateSources().success(function(templateSources) {
        $scope.templateSources = templateSources;
    });

    $scope.$watch('template.src', function(val) {

        if(val) {
            templateService.getTemplateRegions(val).success(function(regions) {

                if(!$scope.template.regions.length) {
                    $scope.template.regions = regions.map(function(region) {
                        return {
                            name: region
                        };
                    });
                }

            }).error(function(err) {
                $rootScope.showError('Error getting template', err);
            });
        }
    });

    if(templateId) {
        templateService.getTemplate(templateId).success(function(template) {
            $scope.template = template;

            template.regions.map(function(region) {
                region.data = stringifyData(region.data);
                region.dataFromServer = !!region.data
                return region;
            });
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
        $scope.template.regions.push({
            name: randTitle
        });
    };

    $scope.removeRegion = function(region) {

        for(var i = $scope.template.regions.length - 1; i >= 0; i--) {
            if($scope.template.regions[i].name === region.name) {
                $scope.template.regions.splice(i, 1);
            }
        }
    };

    $scope.setDefaultPartData = function() {
        //this will check all parts that have not had data explicitly set and set the default part data
        //for the selected part
        $scope.template.regions.forEach(function(region, index) {
            var dataField = $scope.templateForm['regiondata_' + index];
            if(region.part && dataField.$pristine && !region.dataFromServer) {
                region.data = region.part.defaultData || "";
            }
        });
    };

    $scope.getTemplatePreviewUrl = function() {
        if($scope.template) {
            var templateSrc = encodeURIComponent($scope.template.src);
            var regionOutlineColor = encodeURIComponent(localStorage.getItem('sidebarColor'));

            return '/_templates/preview?templateSrc=' + templateSrc + '&regionOutlineColor=' + regionOutlineColor;
        } else {
            return null;
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

        var template = $scope.template;

        //remove any empty properties
        for(var i = template.properties.length - 1; i >= 0; i--) {
            var prop = template.properties[i];
            if(!prop.name) {
                template.properties.splice(i, 1);
            }
        }

        //depopulate parts
        template.regions = template.regions.filter(function(region) {
            return typeof region === 'object';
        }).map(function(region) {
            if(region.part) {
                region.part = region.part._id;
            }
            if(isJson(region.data)) {
                region.data = JSON.parse(region.data);
            }
            return region;
        });

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
        var really = window.confirm('Really delete this template?');
        if(really) {
            templateService.deleteTemplate($scope.template._id).success(function (res) {
                console.log('Template deleted');
                $location.path('/templates');
            }).error(function (err) {
                $rootScope.showError('Error deleting template', err);
            });
        }
    };


    function stringifyData(val) {
        return typeof val === 'object' ? JSON.stringify(val, null, 2) : val;
    }

    function isJson(str) {
        try {
            JSON.parse(str);
        } catch(e) {
            return false;
        }
        return true;
    }
});

})();