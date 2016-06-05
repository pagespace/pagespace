(function() {
    var adminApp = angular.module('adminApp');
    adminApp.factory('macroService', function($http) {

        function MacroService() {
        }
        MacroService.prototype.getMacros = function() {
            return $http.get('/_api/macros').then(res => res.data).catch(res => res.data);
        };
        MacroService.prototype.getMacro = function(macroId) {
            return $http.get('/_api/macros/' + macroId).then(res => res.data).catch(res => res.data);;
        };
        MacroService.prototype.createMacro = function(macroData) {
            return $http.post('/_api/macros', macroData).then(res => res.data).catch(res => res.data);
        };

        MacroService.prototype.updateMacro = function(macroId, macroData) {
            return $http.put('/_api/macros/' + macroId, macroData).then(res => res.data).catch(res => res.data);
        };

        MacroService.prototype.deleteMacro = function(macroId) {
            return $http.delete('/_api/macros/' + macroId).then(res => res.data).catch(res => res.data);
        };

        MacroService.prototype.depopulateMacro = function(macro) {

            delete macro.createdBy;
            delete macro.updatedBy;
            delete macro.createdAt;
            delete macro.updatedAt;

            if(macro.template && macro.template._id) {
                macro.template = macro.template._id;
            }
            if(macro.parentPage && macro.parentPage._id) {
                macro.parentPage = macro.parentPage._id;
            }
            if(macro.basePage && macro.basePage._id) {
                macro.basePage = macro.basePage._id;
            }

            macro.includes = macro.includes.map((include) => {
                if(include.plugin && include.plugin._id) {
                    include.plugin = include.plugin._id
                }
                return include;
            });
            
            return macro;
        };

        return new MacroService();
    });

})();


