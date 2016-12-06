(function() {

    var adminApp = angular.module('adminApp');
    adminApp.directive('includeEditorView', function($log) {
        return {
            scope: {
                pageId: '=',
                pluginName: '=',
                includeId: '='
            },
            template: '',
            link: function (scope, element) {
                const
                    el = element[0],
                    defaultIframeSrc = '/_static/inpage/default-plugin-editor/edit.html';

                let pluginInterface = null;

                scope.$watch('includeId', () => {
                    const
                        pageId = scope.pageId,
                        pluginName = scope.pluginName,
                        includeId = scope.includeId;

                    if (!pageId || !pluginName || !includeId) {
                        return;
                    }

                    const customIframeSrc = '/_static/plugins/' + pluginName + '/edit.html';
                    pluginInterface = window.pagespace.getPluginInterface(pluginName, pageId, includeId);

                    fetch(customIframeSrc).then(function (res) {
                        if (res.status === 404) {
                            setupIframe(defaultIframeSrc, pluginInterface);
                        } else if(res.status === 200) {
                            setupIframe(customIframeSrc, pluginInterface);
                        } else {
                            var err = new Error(res.statusText);
                            err.status = res.status;
                            $log.error(err);
                        }
                    });
                });

                scope.$on('$destroy', function () {
                    /*                  if(iframeHeightUpdateInterval) {
                     clearInterval(iframeHeightUpdateInterval);
                     }*/
                });

                scope.$on('include-saved', function () {
                    if(pluginInterface) {
                        pluginInterface.emit('save');
                    }
                });

                scope.$on('edit-closed', function() {
                    clearEl();
                });

                function clearEl() {
                    while (el.firstChild) {
                        el.removeChild(el.firstChild);
                    }
                }

                function setupIframe(iframeSrc, pluginInterface) {

                    clearEl();

                    const iframe = document.createElement('iframe');
                    iframe.name = 'pagespace-editor';
                    iframe.src = iframeSrc;
                    iframe.width = '100%';
                    iframe.height = '100%';
                    el.appendChild(iframe);

                    //inject plugin interface
                    iframe.contentWindow.window.pagespace = pluginInterface;
                }
            }
        };
    });
})();