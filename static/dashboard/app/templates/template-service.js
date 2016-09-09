(function() {
    var adminApp = angular.module('adminApp');
    adminApp.factory('templateService', function($http, errorFactory) {

        function TemplateService() {
        }
        TemplateService.prototype.getTemplateSources = function() {
            return $http.get('/_templates/available').then(res => res.data).catch(res => {
                throw errorFactory.createResponseError(res);
            });
        };
        TemplateService.prototype.getTemplateRegions = function(templateSrc) {
            return $http.get('/_templates/template-regions', {
                params: {
                    templateSrc: templateSrc
                }
            }).then(res => res.data).catch(res => {
                throw errorFactory.createResponseError(res);
            });
        };
        TemplateService.prototype.getAvailableTemplates = function() {
            return $http.get('/_api/templates').then(res => res.data).catch(res => {
                throw errorFactory.createResponseError(res);
            });
        };
        TemplateService.prototype.getTemplate = function(templateId) {
            return $http.get('/_api/templates/' + templateId).then(res => res.data).catch(res => {
                throw errorFactory.createResponseError(res);
            });
        };
        TemplateService.prototype.createTemplate = function(templateData) {
            return $http.post('/_api/templates', templateData).then(res => res.data).catch(res => {
                throw errorFactory.createResponseError(res);
            });
        };

        TemplateService.prototype.updateTemplate = function(templateId, templateData) {
            return $http.put('/_api/templates/' + templateId, templateData).then(res => res.data).catch(res => {
                throw errorFactory.createResponseError(res);
            });
        };

        TemplateService.prototype.deleteTemplate = function(templateId) {
            return $http.delete('/_api/templates/' + templateId).then(res => res.data).catch(res => {
                throw errorFactory.createResponseError(res);
            });
        };

        return new TemplateService();
    });

})();


