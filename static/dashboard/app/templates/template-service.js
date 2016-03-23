(function() {
    var adminApp = angular.module('adminApp');
    adminApp.factory('templateService', function($http) {

        function TemplateService() {
        }
        TemplateService.prototype.getTemplateSources = function() {
            return $http.get('/_templates/available');
        };
        TemplateService.prototype.getTemplateRegions = function(templateSrc) {
            return $http.get('/_templates/template-regions', {
                params: {
                    templateSrc: templateSrc
                }
            });
        };
        TemplateService.prototype.doGetAvailableTemplates = function() {
            return $http.get('/_api/templates');
        };
        TemplateService.prototype.getTemplate = function(templateId) {
            return $http.get('/_api/templates/' + templateId);
        };
        TemplateService.prototype.createTemplate = function(templateData) {
            return $http.post('/_api/templates', templateData);
        };

        TemplateService.prototype.updateTemplate = function(templateId, templateData) {
            return $http.put('/_api/templates/' + templateId, templateData);
        };

        TemplateService.prototype.deleteTemplate = function(templateId) {
            return $http.delete('/_api/templates/' + templateId);
        };

        return new TemplateService();
    });

})();


