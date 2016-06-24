(function() {
    var adminApp = angular.module('adminApp');
    adminApp.factory('macroService', function($http, $q) {

        function MacroService() {
            this.clearCache();
        }
        MacroService.prototype.getMacros = function() {

            if(Array.isArray(this.macroCache)) {
                return $q.when(this.macroCache);
            }

            return $http.get('/_api/macros').then(res => {
                this.macroCache = res.data;
                return res.data;
            }).catch(res => res.data);
        };
        MacroService.prototype.getMacro = function(macroId) {
            return $http.get('/_api/macros/' + macroId).then(res => res.data).catch(res => res.data);;
        };
        MacroService.prototype.createMacro = function(macroData) {
            return $http.post('/_api/macros', macroData).then(res => {
                this.clearCache();
                return res.data
            }).catch(res => res.data);
        };

        MacroService.prototype.updateMacro = function(macroId, macroData) {
            return $http.put('/_api/macros/' + macroId, macroData).then(res => {
                this.clearCache();
                return res.data;
            }).catch(res => res.data);
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
            if(macro.parent && macro.parent._id) {
                macro.parent = macro.parent._id;
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

        MacroService.prototype.clearCache = function() {
            this.macroCache = null;
        };

        return new MacroService();
    });

})();


