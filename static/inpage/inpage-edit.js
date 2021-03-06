/* globals console */
(function() {
    window.pagespace = window.pagespace || {};
    window.pagespace.setupAdminMode = function() {
        //adds various admin functionality to a page
        handleAdminEvents();
        syncColors();
        decorateIncludes();
        decorateRegions();
    };

    /**
     * Handle Admin Events
     */
    function handleAdminEvents() {

        //listen for clicks that bubble in up in the admin bar
        document.body.addEventListener('click', function (ev) {

            if(ev.target.hasAttribute('data-edit-include')) {
                launchPluginEditor(ev.target);
            } else if(ev.target.hasAttribute('data-add-include')) {
                launchAddInclude(ev.target);
            }
        });

        //intercept link clicks so the parent frame changes
        window.pagespace.interceptLinks = function(ev) {
            if(ev.target.tagName.toUpperCase() === 'A' && ev.target.getAttribute('href').indexOf('/') === 0) {
                var href = ev.target.getAttribute('href');
                window.parent.location.assign('/_dashboard#/view-page/preview' + href);
                ev.preventDefault();
            }
        };
        document.body.addEventListener('click', window.pagespace.interceptLinks);
    }

    /**
     * Sync colours
     */
    function syncColors() {
        //sync colors
        try {
            var specialColor = window.localStorage.getItem('specialColor');
            if(specialColor) {
                var styleSheetsArray = Array.prototype.slice.call(document.styleSheets);
                var styleSheet= styleSheetsArray.filter(function(styleSheet) {
                    return styleSheet.href && styleSheet.href.indexOf('inpage-edit.css') > -1;
                })[0];
                var cssRules = styleSheet.cssRules;
                var cssRulesArray = Array.prototype.slice.call(cssRules);

                //box hover colors
                var boxHoverRule = cssRulesArray.filter(function(rule) {
                    return rule.selectorText === '.ps-box:hover';
                })[0];
                boxHoverRule.style.outlineColor = specialColor;

                var addBoxHoverRule = cssRulesArray.filter(function(rule) {
                    return rule.selectorText === '.ps-region:hover .ps-box-add:hover';
                })[0];
                addBoxHoverRule.style.outlineColor = specialColor;

                //edit button rules
                var editButtonRule = cssRulesArray.filter(function(rule) {
                    return rule.selectorText === '.ps-box .ps-edit';
                })[0];
                editButtonRule.style.backgroundColor = specialColor;

                //grab handle
                var grabHandleRule = cssRulesArray.filter(function(rule) {
                    return rule.selectorText === '.ps-box .ps-grab';
                })[0];
                grabHandleRule.style.backgroundColor = specialColor;

                //add button
                var addButtonRule = cssRulesArray.filter(function(rule) {
                    return rule.selectorText === '.ps-box .ps-add';
                })[0];
                addButtonRule.style.backgroundColor = specialColor;

                //add button
                var dropOverlayRule = cssRulesArray.filter(function(rule) {
                    return rule.selectorText === '.ps-drop-target.ps-drag-over';
                })[0];
                dropOverlayRule.style.outlineColor = specialColor;
                dropOverlayRule.style.color = specialColor;
            }
        } catch(e) {
            console.warn(e);
        }
    }

    /**
     * Decorate includes
     */
    function decorateIncludes() {

        function createEditButton(plugin, pageId, region, include, dataId) {
            var editButton = document.createElement('button');
            editButton.setAttribute('data-edit-include', 'data-edit-include');
            editButton.setAttribute('data-target-plugin', plugin);
            editButton.setAttribute('data-target-page-id', pageId);
            editButton.setAttribute('data-target-region', region);
            editButton.setAttribute('data-target-include', include);
            editButton.setAttribute('data-target-include-id', dataId);
            editButton.setAttribute('title', 'Edit include');
            editButton.classList.add('ps-edit');

            return editButton;
        }

        function createGrabHandle(pageId, region, include, dataId) {
            var grabHandle = document.createElement('div');
            grabHandle.setAttribute('data-grab-include', 'data-grab-include');
            grabHandle.setAttribute('data-target-page-id', pageId);
            grabHandle.setAttribute('data-target-region', region);
            grabHandle.setAttribute('data-target-include', include);
            grabHandle.setAttribute('data-target-include-id', dataId);
            grabHandle.setAttribute('title', 'Drag include');
            grabHandle.classList.add('ps-grab');
            return grabHandle;
        }

        function createDropTarget(include, first) {
            var dropTarget = document.createElement('div');
            dropTarget.setAttribute('data-page-id', include.getAttribute('data-page-id'));
            if(!first) {
                //empty include implies first
                dropTarget.setAttribute('data-target-include', first ? '' : include.getAttribute('data-include'));
            }
            dropTarget.classList.add('ps-drop-target');
            dropTarget.textContent = 'Move here';
            return dropTarget;
        }

        Array.prototype.slice.call(document.querySelectorAll('[data-include]')).forEach(function(include, i) {
            include.classList.add('ps-box');

            var dropTargets = [];
            dropTargets[0] = createDropTarget(include);
            include.parentNode.insertBefore(dropTargets[0], include.nextElementSibling);
            if(!include.previousElementSibling) {
                dropTargets[1] = createDropTarget(include);
                include.parentNode.insertBefore(dropTargets[1], include);
            }

            //edit button
            var editButton = createEditButton(
                include.getAttribute('data-plugin'),
                include.getAttribute('data-page-id'),
                include.getAttribute('data-region-name'),
                include.getAttribute('data-include'),
                include.getAttribute('data-include-id'));
            include.insertBefore(editButton, include.firstChild);

            //grab handle
            var grabHandle = createGrabHandle(
                include.getAttribute('data-page-id'),
                include.getAttribute('data-region-name'),
                include.getAttribute('data-include'),
                include.getAttribute('data-include-id'));
            include.insertBefore(grabHandle, include.firstChild);

            //drag include
            grabHandle.draggable = true;
            grabHandle.addEventListener('dragstart', function(ev) {
                window.parent.postMessage({ name: 'drag-include-start' }, window.location.origin);
                var includeInfo = {
                    pageId: this.getAttribute('data-target-page-id'),
                    region: this.getAttribute('data-target-region'),
                    includeIndex: this.getAttribute('data-target-include'),
                    includeId: this.getAttribute('data-target-include-id')
                };
                ev.dataTransfer.effectAllowed = 'move';
                ev.dataTransfer.setData('include-info', JSON.stringify(includeInfo));
                ev.dataTransfer.setDragImage(include, include.offsetWidth - (include.offsetWidth / 9), 8);

                setTimeout(function () {
                    include.classList.add('ps-no-drop');
                    include.parentNode.classList.add('ps-dragging-include');

                    var nextSibling = include.nextElementSibling, prevSibling = include.previousElementSibling;
                    if(nextSibling && nextSibling.classList.contains('ps-drop-target')) {
                        nextSibling.classList.add('ps-no-drop');
                    }
                    if(prevSibling && prevSibling.classList.contains('ps-drop-target')) {
                        prevSibling.classList.add('ps-no-drop');
                    }
                }, 0);
            }, false);

            grabHandle.addEventListener('dragend', function() {
                window.parent.postMessage({ name: 'drag-include-end' }, window.location.origin);
                include.classList.remove('ps-no-drop');
                include.parentNode.classList.remove('ps-dragging-include');

                var nextSibling = include.nextElementSibling, prevSibling = include.previousElementSibling;
                if(nextSibling) {
                    nextSibling.classList.remove('ps-no-drop');
                }
                if(prevSibling) {
                    prevSibling.classList.remove('ps-no-drop');
                }
            }, false);

            //drop on include
            dropTargets.forEach(function(dropTarget) {
                dropTarget.addEventListener('dragenter', function(ev) {
                    if(containsType(ev.dataTransfer.types, 'include-info')) {
                        this.classList.add('ps-drag-over');
                        ev.preventDefault();
                    }
                });
            });

            dropTargets.forEach(function(dropTarget) {
                dropTarget.addEventListener('dragover', function (ev) {
                    if (containsType(ev.dataTransfer.types, 'include-info')) {
                        ev.dataTransfer.dropEffect = 'move';
                        ev.preventDefault();
                    }
                });
            });

            dropTargets.forEach(function(dropTarget) {
                dropTarget.addEventListener('dragleave', function (ev) {
                    if (containsType(ev.dataTransfer.types, 'include-info')) {
                        this.classList.remove('ps-drag-over');
                        ev.preventDefault();
                    }
                });
            });
            dropTargets.forEach(function(dropTarget) {
                dropTarget.addEventListener('drop', function (ev) {
                    var data = getIncludeDragData(ev);
                    if (data) {
                        ev.preventDefault();

                        var toIndex = this.getAttribute('data-target-include') || 0;
                        var fromIndex = data.includeIndex;
                        var region = data.region;
                        var message = {
                            name: 'move-include',
                            pageId: this.getAttribute('data-page-id'),
                            regionName: region,
                            fromIndex: parseInt(fromIndex, 10),
                            toIndex: parseInt(toIndex, 10)
                        };
                        window.parent.postMessage(message, window.location.origin);
                    }
                    this.classList.remove('ps-drag-over');
                });
            });

            //utils for drag+drop
            function getIncludeDragData(ev) {
                var data = ev.dataTransfer.getData('include-info');
                return data ? JSON.parse(data) : null;
            }

            function containsType(list, value) {
                for( var i = 0; i < list.length; ++i ) {
                    if(list[i] === value) {
                        return true;
                    }
                }
                return false;
            }
        });
    }

    /**
     * Decorate regions (add include UI)
     */
    function decorateRegions() {

        Array.prototype.slice.call(document.querySelectorAll('[data-region]')).forEach(function(region) {
            region.classList.add('ps-region');

            var pageId = region.getAttribute('data-page-id');
            var regionName = region.getAttribute('data-region');

            var addButton = document.createElement('button');
            addButton.setAttribute('data-add-include', pageId);
            addButton.setAttribute('data-target-page-id', pageId);
            addButton.setAttribute('data-target-region', regionName);
            addButton.setAttribute('title', 'Add include');
            addButton.classList.add('ps-add');

            var psAddBox = document.createElement('div');
            psAddBox.classList.add('ps-box');
            psAddBox.classList.add('ps-box-add');
            psAddBox.appendChild(addButton);

            region.appendChild(psAddBox);
        });
    }

    /**
     * Launch edit
     * @param evSrc
     */
    function launchPluginEditor(evSrc) {

        //data about the plugin from the button that launched the editor
        var pluginName = evSrc.getAttribute('data-target-plugin');
        var region = evSrc.getAttribute('data-target-region');
        var pageId = evSrc.getAttribute('data-target-page-id');
        var includeId = evSrc.getAttribute('data-target-include-id');

        window.parent.postMessage({
            name: 'edit-include',
            pageId: pageId,
            regionName: region,
            includeId: includeId,
            pluginName: pluginName
        }, window.location.origin);
    }

    /**
     * Launch add
     * @param evSrc
     */
    function launchAddInclude(evSrc) {

        var pageId = evSrc.getAttribute('data-target-page-id');
        var region = evSrc.getAttribute('data-target-region');
        
        window.parent.postMessage({
            name: 'add-include',
            pageId: pageId,
            regionName: region
        }, window.location.origin);
    }
})();