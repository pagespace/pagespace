(function() {

/**
 *
 * @type {*}
 */
var adminApp = angular.module('adminApp');
adminApp.controller('PluginController', function($scope, $rootScope, $log, $routeParams, $location, $window,
                                                 pluginService) {

    var pluginId = $routeParams.pluginId;

    //sets the code mirror mode for editing raw plugin data
    $scope.editorOpts = {
        mode: 'application/json'
    };

    $scope.plugin = {};

    if(pluginId) {
        $scope.pluginId = pluginId;
        pluginService.getPlugin(pluginId).then(function(plugin) {
            $scope.plugin = plugin;
        }).catch(function(err) {
            $scope.showError('Error getting plugin', err);
        });
    }

    $scope.reset = function() {
        pluginService.resetPlugin($scope.plugin).then(function() {
            $scope.showSuccess('Cache cleared');
        }).catch(function(err) {
            $scope.showError('Error getting plugin', err);
        });
    };

    $scope.cancel = function() {
        $location.path('/plugins');
    };

    $scope.save = function(form) {
        if(form.$invalid) {
            $scope.submitted = true;
            $window.scrollTo(0,0);
            return;
        }

        if(pluginId) {
            pluginService.updatePlugin(pluginId, $scope.plugin).then(function() {
                $log.info('Plugin saved');
                $scope.showSuccess('Plugin updated.');
                $location.path('/plugins');
            }).catch(function(err) {
                $scope.showError('Error updating plugin', err);
            });
        } else {
            pluginService.createPlugin($scope.plugin).then(function() {
                $log.info('Plugin created');
                $scope.showSuccess('Plugin created.');
                $location.path('/plugins');
            }).catch(function(err) {
                $scope.showError('Error saving plugin', err);
            });
        }
    };

    $scope.remove = function() {
        var really = window.confirm('Really delete this plugin?');
        if(really) {
            pluginService.deletePlugin($scope.plugin._id).then(function () {
                $scope.showInfo('Plugin deleted');
                $location.path('/plugins');
            }).catch(function (err) {
                $scope.showError('Error deleting plugin', err);
            });
        }
    };
});



})();