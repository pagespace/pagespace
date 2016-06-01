(function() {
    var adminApp = angular.module('adminApp');
    adminApp.factory('pluginService', function($http) {

        function PluginService() {
        }
        PluginService.prototype.getPlugins = function() {
            return $http.get('/_api/plugins').then(res => res.data).catch(res => res.data);
        };
        PluginService.prototype.getPlugin = function(pluginId) {
            return $http.get('/_api/plugins/' + pluginId).then(res => res.data).catch(res => res.data);
        };

        PluginService.prototype.createPlugin = function(pluginData) {
            return $http.post('/_api/plugins', pluginData).then(res => res.data).catch(res => res.data);
        };

        PluginService.prototype.deletePlugin = function(pluginId) {
            return $http.delete('/_api/plugins/' + pluginId).then(res => res.data).catch(res => res.data);
        };

        PluginService.prototype.updatePlugin = function(pluginId, pluginData) {
            return $http.put('/_api/plugins/' + pluginId, pluginData).then(res => res.data).catch(res => res.data);
        };

        PluginService.prototype.resetPlugin = function(pluginData) {
            return $http.put('/_cache/plugins', {
                module: pluginData.module
            }).then(res => res.data).catch(res => res.data);
        };


        return new PluginService();
    });

})();


