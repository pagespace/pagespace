(function() {

/**
 *
 * @type {*}
 */
var adminApp = angular.module('adminApp');
adminApp.controller('TemplateController', function($log, $scope, $rootScope, $routeParams, $location, $window,
                                                   templateService, pluginService) {
    $log.info('Showing Template View');

    var templateId = $routeParams.templateId;

    $scope.selectedRegionIndex = 0;
    $scope.template = {
        properties: [],
        regions: [],
        regionData: []
    };

    pluginService.getPlugins().success(function(availablePlugins) {
        $scope.availablePlugins = availablePlugins;
    });

    templateService.getTemplateSources().success(function(templateSources) {
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
        templateService.getTemplate(templateId).success(function(template) {
            $log.debug('Got template data:\n', JSON.stringify(template, null, '\t'));
            $scope.template = template;

            $scope.template.regions = template.regions.map(function(region) {
                region.includes = region.includes.map(function(include) {
                    include.data = stringifyData(include.data);
                    return include;
                });
                return region;
            });
        }).error(function(err) {
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

    $scope.scanRegions = function(templateSrc) {

        templateSrc = templateSrc || $scope.template.src;

        templateService.getTemplateRegions(templateSrc).success(function(newRegions) {
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
        }).error(function(err) {
            $scope.showError('Error getting template regions', err);
        });
    };

    $scope.addInclude = function(regionIndex) {
        $scope.template.regions[regionIndex].includes.push({
            plugin: null,
            data: {}
        });
    };

    $scope.setDefaultDataForInclude = function(regionIndex, includeIndex) {
        var pluginId = $scope.template.regions[regionIndex].includes[includeIndex].plugin._id;
        var plugin = $scope.availablePlugins.filter(function(availablePlugin) {
            return availablePlugin._id === pluginId;
        })[0];
        var defaultData = plugin && plugin.defaultData ? plugin.defaultData : {};
        $scope.template.regions[regionIndex].includes[includeIndex].data = stringifyData(defaultData);
    };

    $scope.removeInclude = function(regionIndex, includeIndex) {
        var really = window.confirm('Really delete this include?');
        if(really) {
            for(var i = $scope.template.regions[regionIndex].includes.length - 1; i >= 0; i--) {
                if(i === includeIndex) {
                    $scope.template.regions[regionIndex].includes.splice(i, 1);
                }
            }
        }
    };

    $scope.getTemplatePreviewUrl = function() {
        if($scope.template && $scope.template.src) {
            var templateSrc = encodeURIComponent($scope.template.src);
            var regionOutlineColor = encodeURIComponent(localStorage.getItem('specialColor'));
            var templatePreviewUrl = '/_templates/preview?templateSrc=' + templateSrc +
                '&regionOutlineColor=' + regionOutlineColor;
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

        //depopulate plugins
        template.regions = template.regions.filter(function(region) {
            return typeof region === 'object';
        }).map(function(region) {
            region.includes = region.includes.map(function(include) {
                include.plugin = include.plugin._id;
                if(isJson(include.data)) {
                    include.data = JSON.parse(include.data);
                }
                return include;
            });

            return region;
        });

        if(templateId) {
            $log.info('Updating template: %s...', templateId);
            $log.debug('with data:\n%s', JSON.stringify($scope.template, null, '\t'));
            templateService.updateTemplate(templateId, $scope.template).success(function() {
                $log.info('Template updated successfully');
                $scope.showSuccess('Template updated.');
                $location.path('/templates');
            }).error(function(err) {
                $log.error(err, 'Error updating template');
                $scope.showError('Error updating template', err);
            });
        } else {
            $log.info('Creating new template...');
            $log.debug('with data:\n%s', JSON.stringify($scope.template, null, '\t'));
            templateService.createTemplate($scope.template).success(function() {
                $log.info('Template created successfully');
                $scope.showSuccess('Template created.');
                $location.path('/templates');
            }).error(function(err) {
                $log.error(err, 'Error creating template');
                $scope.showError('Error creating template', err);
            });
        }
    };

    $scope.remove = function() {
        var really = window.confirm('Really delete this template?');
        if(really) {
            $log.info('Deleting template: %s...', $scope.template._id);
            templateService.deleteTemplate($scope.template._id).success(function() {
                $log.info('Template deleted');
                $location.path('/templates');
            }).error(function (err) {
                $log.error(err, 'Could not delete template');
                $scope.showError('Error deleting template', err);
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