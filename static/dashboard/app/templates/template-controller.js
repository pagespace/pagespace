(function() {

/**
 *
 * @type {*}
 */
var adminApp = angular.module('adminApp');
adminApp.controller('TemplateController', function($log, $scope, $rootScope, $routeParams, $location, $window,
                                                   templateService) {
    $log.info('Showing Template View');

    var templateId = $routeParams.templateId;

    $scope.template = {
        properties: [],
        regions: [],
        regionData: []
    };

    templateService.getTemplateSources().then(function(templateSources) {
        $scope.templateSources = templateSources;
    });

    $scope.$watch('template.src', function(val) {
        if(val && !templateId) {
            $log.debug('Fetching regions for template src: %s...', val);
            $scope.scanRegions(val);
        }
    });

    if(templateId) {
        $scope.templateId = templateId;
        $log.debug('Fetching template data for id: %s...', templateId);
        templateService.getTemplate(templateId).then(function(template) {
            $log.debug('Got template data:\n', JSON.stringify(template, null, '\t'));
            $scope.template = template;
        }).catch(function(err) {
            $log.error(err, 'Error getting template');
            $scope.showError('Error getting template', err);
        });
    }

    $scope.addProperty = function() {
        $scope.template.properties.push({
            name: '',
            value: ''
        });
    };

    $scope.removeProperty = function(prop) {
        var index = $scope.template.properties.indexOf(prop);
        if (index > -1) {
            $scope.template.properties.splice(index, 1);
        }
    };


    $scope.scanRegions = function(templateSrc) {

        templateSrc = templateSrc || $scope.template.src;

        templateService.getTemplateRegions(templateSrc).then(function(newRegions) {
            $log.debug('Got regions: %s', newRegions);

            function isRegionNew(regionName) {
                return !$scope.template.regions.some(function(region) {
                    return region.name === regionName;
                });
            }

            newRegions.forEach(function(regionName) {
                if(isRegionNew(regionName)) {
                    $scope.template.regions.push({
                        name: regionName,
                        includes: []
                    });
                }
            });
        }).catch(function(err) {
            $scope.showError('Error getting template regions', err);
        });
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

        if(templateId) {
            $log.info('Updating template: %s...', templateId);
            $log.debug('with data:\n%s', JSON.stringify($scope.template, null, '\t'));
            templateService.updateTemplate(templateId, $scope.template).then(function() {
                $log.info('Template updated successfully');
                $scope.showSuccess('Template updated.');
                $location.path('/templates');
            }).catch(function(err) {
                $log.error(err, 'Error updating template');
                $scope.showError('Error updating template', err);
            });
        } else {
            $log.info('Creating new template...');
            $log.debug('with data:\n%s', JSON.stringify($scope.template, null, '\t'));
            templateService.createTemplate($scope.template).then(() => {
                $log.info('Template created successfully');
                $scope.showSuccess('Template created.');
                $location.path('/templates');
            }).catch(err => {
                $log.error(err, 'Error creating template');
                $scope.showError('Error creating template', err);
            });
        }
    };

    $scope.remove = function() {
        var really = window.confirm('Really delete this template?');
        if(really) {
            $log.info('Deleting template: %s...', $scope.template._id);
            templateService.deleteTemplate($scope.template._id).then(() => {
                $log.info('Template deleted');
                $location.path('/templates');
            }).error(err => {
                $log.error(err, 'Could not delete template');
                $scope.showError('Error deleting template', err);
            });
        }
    };

    $scope.duplicate = function() {

        $log.info('Duplicating template %s', $scope.template._id);

        const newTemplate = JSON.parse(JSON.stringify($scope.template));
        delete newTemplate._id;
        delete newTemplate.createdAt;
        delete newTemplate.createdBy;
        delete newTemplate.updatedAt;
        delete newTemplate.updatedBy;

        newTemplate.name = `${newTemplate.name} (copy)`;
        templateService.createTemplate(newTemplate).then(() => {
            $log.info('Template duplicated successfully');
            $scope.showSuccess('Template duplicated.');
            $location.path('/templates');
        }).catch(err => {
            $log.error(err, 'Error duplicating template');
            $scope.showError('Error duplicating template', err);
        });
    }
});

})();