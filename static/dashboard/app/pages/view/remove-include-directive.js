(function() {

    const 
        adminApp = angular.module('adminApp'),
        
        tmpl =
            `<div class="remove-include-action well">
                <span class="glyphicon glyphicon-trash"></span> Remove
            </div>`;
        
    adminApp.directive('removeIncludeDrop', function() {
        return {
            replace: true,
            template: tmpl,
            link: function link(scope, element) {

                var dragCounter = 0;
                element[0].addEventListener('dragenter', function(ev) {
                    if(containsType(ev.dataTransfer.types, 'include-info')) {
                        dragCounter++;
                        this.classList.add('drag-over');
                        ev.preventDefault();
                    }
                });
                element[0].addEventListener('dragover', function(ev) {
                    if(containsType(ev.dataTransfer.types, 'include-info')) {
                        ev.dataTransfer.dropEffect = 'move';
                        ev.preventDefault();
                    }
                });
                element[0].addEventListener('dragleave', function(ev) {
                    if(containsType(ev.dataTransfer.types, 'include-info')) {
                        dragCounter--;
                        if(dragCounter === 0) {
                            this.classList.remove('drag-over');
                            ev.preventDefault();
                        }
                    }
                });
                element[0].addEventListener('drop', function(ev) {
                    if(containsType(ev.dataTransfer.types, 'include-info')) {
                        var data = ev.dataTransfer.getData('include-info');
                        data = JSON.parse(data);
                        var pageId = data.pageId;
                        var regionName = data.region;
                        var includeIndex =  parseInt(data.includeIndex);
                        scope.remove(pageId, regionName, includeIndex);
                        ev.preventDefault();
                    }
                });

                function containsType(list, value) {
                    for( var i = 0; i < list.length; ++i ) {
                        if(list[i] === value) {
                            return true;
                        }
                    }
                    return false;
                }
            },
            controller: function($log, $scope, pageService) {
                $scope.remove = function(pageId, regionName, includeIndex) {
                    pageService.getPage(pageId).then(function(page) {
                        page = pageService.removeInclude(page, regionName, includeIndex);
                        page = pageService.depopulatePage(page);
                        pageService.updatePage(pageId, page).then(function() {
                            $log.info('Include removed for pageId=%s, region=%s, include=%s',
                                pageId, regionName, includeIndex);
                            $scope.$broadcast('include-removed');
                        }).catch(function(err) {
                            $scope.err = err;
                            $log.error(err, 'Update page to remove include failed (pageId=%s, region=%s, include=%s)',
                                pageId, regionName, includeIndex);
                        });
                    }).catch(function(err) {
                        $scope.err = err;
                        $log.error(err, 'Unable to get page: %s', pageId);
                    });
                };
            }
        };
    });
})();