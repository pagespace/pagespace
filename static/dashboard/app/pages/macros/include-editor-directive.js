(function() {

    var adminApp = angular.module('adminApp');
    adminApp.directive('includeEditor', function() {
        return {
            scope: {
                page: '=',
                region: '=',
                onSave: '&'
            },
            template: '',
            link: function (scope, element) {
                var page = scope.page;
                var regionName = scope.region;

                if(page && regionName) {
                    var region = page.regions.find((region) => region.name === regionName);
                    if(region) {
                        var includeHolder = region.includes[0];
                        var pluginInterface =
                            pagespace.getPluginInterface(includeHolder.plugin.name, page._id, includeHolder.include._id);
                        var iframe = document.createElement('iframe');
                        iframe.name = 'edit-incliude';
                        iframe.src = `/_static/plugins/${includeHolder.plugin.name}/edit.html`;
                        iframe.width = '100%';
                        iframe.height = '500px';
                        iframe.style.border = 'none';
                        iframe.style.marginTop = '1em';
                        element[0].appendChild(iframe);
                        iframe.contentWindow.window.pagespace = pluginInterface;
                        
                        scope.$on('save', function() {
                            console.log('save!!!!')
                            pluginInterface.emit('save');
                        });
                    }
                }
            }
        }
    });
})();