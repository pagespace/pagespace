(function() {
    var adminApp = angular.module('adminApp');
    adminApp.factory('partInstanceService', function($http) {

        function PartInstanceService() {
            this.pageCache = [];
        }
        PartInstanceService.prototype.getPartInstances = function() {
            return $http.get('/_api/part-instances');
        };
        PartInstanceService.prototype.getPartInstance = function(partInstanceId) {
            return $http.get('/_api/part-instances/' + partInstanceId);
        };

        PartInstanceService.prototype.createPartInstance = function(partInstanceData) {
            return $http.post('/_api/part-instances', partInstanceData);
        };

        PartInstanceService.prototype.deletePartInstance = function(partInstanceId) {
            return $http.delete('/_api/part-instances/' + partInstanceId);
        };

        PartInstanceService.prototype.updatePartInstance = function(partInstanceId, partInstanceData) {
            return $http.put('/_api/part-instances/' + partInstanceId, partInstanceData);
        };


        return new PartInstanceService();
    });

})();


