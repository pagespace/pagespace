(function() {

/**
 *
 * @type {*}
 */
var adminApp = angular.module('adminApp');
adminApp.controller('TemplateController', function($log, $scope, $rootScope, $routeParams, $location, $window,
                                                   templateService, partService) {

    $log.info('Showing Template View');

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
            $log.debug('Fetching regions for template src: %s...', val);
            templateService.getTemplateRegions(val).success(function(regions) {
                $log.debug('Got regions: %s', regions);
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
        $log.debug('Fetching template data for id: %s...', templateId);
        templateService.getTemplate(templateId).success(function(template) {
            $log.debug('Got template data:\n', JSON.stringify(template, null, '\t'));
            $scope.template = template;

            template.regions.map(function(region) {
                region.data = stringifyData(region.data);
                region.dataFromServer = !!region.data
                return region;
            });
        }).error(function(err) {
            $log.error(err, 'Error getting template');
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

    $scope.getTemplatePreviewUrl = function() {
        if($scope.template && $scope.template.src) {
            var templateSrc = encodeURIComponent($scope.template.src);
            var regionOutlineColor = encodeURIComponent(localStorage.getItem('sidebarColor'));
            var templatePreviewUrl = '/_templates/preview?templateSrc=' + templateSrc + '&regionOutlineColor=' + regionOutlineColor;
            $log.debug('Template preview url is: %s', templatePreviewUrl);
            return templatePreviewUrl;
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
            $log.info('Updating template: %s...', templateId);
            $log.debug('with data:\n%s', JSON.stringify($scope.template, null, '\t'));
            templateService.updateTemplate(templateId, $scope.template).success(function() {
                $log.info('Template updated successfully');
                $rootScope.showSuccess('Template updated.');
                $location.path('/templates');
            }).error(function(err) {
                $log.error(err, 'Error updating template');
                $rootScope.showError('Error updating template', err);
            });
        } else {
            $log.info('Creating new template...');
            $log.debug('with data:\n%s', JSON.stringify($scope.template, null, '\t'));
            templateService.createTemplate($scope.template).success(function() {
                $log.info('Template created successfully');
                $rootScope.showSuccess('Template created.');
                $location.path('/templates');
            }).error(function(err) {
                $log.error(err, 'Error creating template');
                $rootScope.showError('Error creating template', err);
            });
        }
    };

    $scope.remove = function() {
        var really = window.confirm('Really delete this template?');
        if(really) {
            $log.info('Deleting template: %s...', $scope.template._id);
            templateService.deleteTemplate($scope.template._id).success(function (res) {
                $log.info('Template deleted');
                $location.path('/templates');
            }).error(function (err) {
                $log.error(err, 'Could not delete template');
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