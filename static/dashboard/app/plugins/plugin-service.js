(function() {
    var adminApp = angular.module('adminApp');
    adminApp.factory('pluginService', function($http) {

        function PluginService() {
        }
        PluginService.prototype.getPlugins = function() {
            return $http.get('/_api/plugins');
        };
        PluginService.prototype.getPlugin = function(pluginId) {
            return $http.get('/_api/plugins/' + pluginId);
        };

        PluginService.prototype.createPlugin = function(pluginData) {
            return $http.post('/_api/plugins', pluginData);
        };

        PluginService.prototype.deletePlugin = function(pluginId) {
            return $http.delete('/_api/plugins/' + pluginId);
        };

        PluginService.prototype.updatePlugin = function(pluginId, pluginData) {
            return $http.put('/_api/plugins/' + pluginId, pluginData);
        };

        PluginService.prototype.resetPlugin = function(pluginData) {
            return $http.put('/_cache/plugins', {
                module: pluginData.module
            });
        };


        return new PluginService();
    });

})();


