(function() {
    var adminApp = angular.module('adminApp');
    adminApp.factory('partService', function($http) {

        function PartService() {
            this.pageCache = [];
        }
        PartService.prototype.getParts = function() {
            return $http.get('/_api/parts');
        };
        PartService.prototype.getPart = function(partId) {
            return $http.get('/_api/parts/' + partId);
        };

        PartService.prototype.createPart = function(partData) {
            return $http.post('/_api/parts', partData);
        };

        PartService.prototype.deleteTemplate = function(partId) {
            return $http.delete('/_api/parts/' + partId);
        };

        PartService.prototype.updateTemplate = function(partId, partData) {
            return $http.put('/_api/parts/' + partId, partData);
        };


        return new PartService();
    });

})();


