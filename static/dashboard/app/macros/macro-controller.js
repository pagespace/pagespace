(function() {

    /**
     *
     * @type {*}
     */
    var adminApp = angular.module('adminApp');
    adminApp.controller('MacroController', function($log, $scope, $rootScope, $routeParams, $location, $window,
                                                    macroService, templateService, pluginService, pageService) {
        $log.info('Showing Macro View');
        
        $scope.getPageHierarchyName = pageService.getPageHierarchyName;

        var macroId = $routeParams.macroId;

        $scope.macro = {
            includes: []
        };

        $scope.allPages = [];
        var setupPromises = [];
        setupPromises.push(pageService.getPages().then(function(pages) {
            $scope.allPages = pages;
        }).catch(function(err) {
            $scope.showError('Couldn\'t get all pages', err);
        }));

        $scope.templates = [];
        setupPromises.push(templateService.doGetAvailableTemplates().then(function(templates) {
            $log.info('Got available templates.');
            $scope.templates = templates;
        }));

        $scope.plugins = [];
        setupPromises.push(pluginService.getPlugins().then(function(plugins) {
            $log.info('Got available plugins.');
            $scope.plugins = plugins;
        }));

        if(macroId) {
            $scope.macroId = macroId;
            $log.debug('Fetching macro data for id: %s...', macroId);
            setupPromises.push(macroService.getMacro(macroId).then(function(macro) {
                $log.debug('Got macro data:\n', JSON.stringify(macro, null, '\t'));
                $scope.macro = macro;
            }).catch(function(err) {
                $log.error(err, 'Error getting macro');
                $scope.showError('Error getting macro', err);
            }));
        }

        Promise.all(setupPromises).then(function () {
            //if there's only one template choose it automatically
            if($scope.templates.length === 1) {
                $scope.macro.template = $scope.templates[0];
            }
        }).catch(function (err) {
            $scope.showError(err);
        });

        $scope.addInclude = function(regionName) {
            $scope.macro.includes.push({
                name: '',
                plugin: {},
                region: regionName,
                _justAdded: true
            });
        };
        $scope.clearJustAdded = function(include) {
            delete include._justAdded;
        };

        $scope.cancel = function() {
            $location.path('/macros');
        };

        $scope.save = function(form) {
            if(form.$invalid) {
                $window.scrollTo(0,0);
                $scope.submitted = true;
                return;
            }

            var macro = macroService.depopulateMacro($scope.macro);
            if(macroId) {
                $log.info('Updating macro: %s...', macroId);
                $log.debug('with data:\n%s', JSON.stringify(macro, null, '\t'));
                macroService.updateMacro(macroId, macro).then(function() {
                    $log.info('Macro updated successfully');
                    $scope.showSuccess('Macro updated.');
                    $location.path('/macros');
                }).catch(function(err) {
                    $log.error(err, 'Error updating macro');
                    $scope.showError('Error updating macro', err);
                });
            } else {
                $log.info('Creating new macro...');
                $log.debug('with data:\n%s', JSON.stringify(macro, null, '\t'));
                macroService.createMacro($scope.macro).then(function() {
                    $log.info('Macro created successfully');
                    $scope.showSuccess('Macro created.');
                    $location.path('/macros');
                }).catch(function(err) {
                    $log.error(err, 'Error creating macro');
                    $scope.showError('Error creating macro', err);
                });
            }
        };

        $scope.remove = function() {
            var really = window.confirm('Really delete this macro?');
            if(really) {
                $log.info('Deleting macro: %s...', $scope.macro._id);
                macroService.deleteMacro($scope.macro._id).then(function() {
                    $log.info('Macro deleted');
                    $location.path('/macros');
                }).error(function (err) {
                    $log.error(err, 'Could not delete macro');
                    $scope.showError('Error deleting macro', err);
                });
            }
        };
    });

})();