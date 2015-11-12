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
                    return rule.selectorText === '.ps-drag-over .ps-drop-overlay';
                })[0];
                dropOverlayRule.style.backgroundColor = specialColor;
            }
        } catch(e) {
            console.warn(e);
        }
    }

    /**
     * Decorate includes
     */
    function decorateIncludes() {

        function createEditButton(plugin, pluginName, pageId, region, include, dataId) {
            var editButton = document.createElement('button');
            editButton.setAttribute('data-edit-include', 'data-edit-include');
            editButton.setAttribute('data-target-plugin', plugin);
            editButton.setAttribute('data-target-plugin-name', pluginName);
            editButton.setAttribute('data-target-page-id', pageId);
            editButton.setAttribute('data-target-region', region);
            editButton.setAttribute('data-target-include', include);
            editButton.setAttribute('data-target-data-id', dataId);
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
            grabHandle.setAttribute('data-target-data-id', dataId);
            grabHandle.setAttribute('title', 'Drag include');
            grabHandle.classList.add('ps-grab');
            return grabHandle;
        }

        Array.prototype.slice.call(document.querySelectorAll('[data-region]')).forEach(function(include) {
            include.classList.add('ps-box');

            //edit button
            var editButton = createEditButton(
                include.getAttribute('data-plugin'),
                include.getAttribute('data-plugin-name'),
                include.getAttribute('data-page-id'),
                include.getAttribute('data-region'),
                include.getAttribute('data-include'),
                include.getAttribute('data-data-id'));
            include.insertBefore(editButton, include.firstChild);

            //grab handle
            var grabHandle = createGrabHandle(
                include.getAttribute('data-page-id'),
                include.getAttribute('data-region'),
                include.getAttribute('data-include'),
                include.getAttribute('data-data-id'));
            include.insertBefore(grabHandle, include.firstChild);

            var dragOverlay = document.createElement('div');
            dragOverlay.classList.add('ps-drop-overlay');
            include.insertBefore(dragOverlay, include.firstChild);

            //drag include
            grabHandle.draggable = true;
            grabHandle.addEventListener('dragstart', function(ev) {
                window.parent.postMessage({ name: 'drag-include-start' }, window.location.origin);
                var includeInfo = {
                    pageId: this.getAttribute('data-target-page-id'),
                    region: this.getAttribute('data-target-region'),
                    includeIndex: this.getAttribute('data-target-include'),
                    dataId: this.getAttribute('data-target-data-id')
                };
                ev.dataTransfer.effectAllowed = 'move';
                ev.dataTransfer.setData('include-info', JSON.stringify(includeInfo));
                ev.dataTransfer.setDragImage(include, include.offsetWidth - (include.offsetWidth / 9), 8);
                include.classList.add('ps-no-drop');
                include.parentNode.classList.add('ps-dragging-include');
            }, false);

            grabHandle.addEventListener('dragend', function() {
                window.parent.postMessage({ name: 'drag-include-end' }, window.location.origin);
                document.body.classList.remove('ps-dragging-include');
                include.classList.remove('ps-no-drop');
                include.parentNode.classList.remove('ps-dragging-include');
            }, false);

            //drop on include
            var dragCounter = 0;
            include.addEventListener('dragenter', function(ev) {
                if(containsType(ev.dataTransfer.types, 'include-info')) {
                    dragCounter++;
                    this.classList.add('ps-drag-over');
                    ev.preventDefault();
                }
            });
            include.addEventListener('dragover', function(ev) {
                if(containsType(ev.dataTransfer.types, 'include-info')) {
                    ev.dataTransfer.dropEffect = 'move';
                    ev.preventDefault();
                }
            });
            include.addEventListener('dragleave', function(ev) {
                if(containsType(ev.dataTransfer.types, 'include-info')) {
                    dragCounter--;
                    if(dragCounter === 0) {
                        this.classList.remove('ps-drag-over');
                        ev.preventDefault();
                    }
                }
            });
            include.addEventListener('drop', function(ev) {
                var data = getIncludeDragData(ev);
                if(data) {
                    var thisRegion = this.getAttribute('data-region');
                    var thisInclude = this.getAttribute('data-include');
                    var thatInclude = data.includeIndex;
                    var thatRegion = data.region;
                    if((thatRegion === thisRegion) && (thatInclude !== thisInclude)) {
                        ev.preventDefault();
                        var message = {
                            name: 'swap-includes',
                            pageId: this.getAttribute('data-page-id'),
                            regionName: thisRegion,
                            includeOne: thisInclude,
                            includeTwo: thatInclude
                        };
                        window.parent.postMessage(message, window.location.origin);
                    }
                }
                this.classList.remove('ps-drag-over');
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

        Array.prototype.slice.call(document.querySelectorAll('[data-region]:last-child')).forEach(function(include) {
            include.parentNode.classList.add('ps-region');

            var pageId = include.getAttribute('data-page-id');
            var region = include.getAttribute('data-region');

            var addButton = document.createElement('button');
            addButton.setAttribute('data-add-include', pageId);
            addButton.setAttribute('data-target-page-id', pageId);
            addButton.setAttribute('data-target-region', region);
            addButton.setAttribute('title', 'Add include');
            addButton.classList.add('ps-add');

            var psAddBox = document.createElement('div');
            psAddBox.classList.add('ps-box');
            psAddBox.classList.add('ps-box-add');
            psAddBox.appendChild(addButton);

            include.insertAdjacentHTML('afterend', psAddBox.outerHTML);
        });
    }

    /**
     * Launch edit
     * @param evSrc
     */
    function launchPluginEditor(evSrc) {

        //data about the plugin from the button that launched the editor
        var plugin = evSrc.getAttribute('data-target-plugin');
        var pluginName = evSrc.getAttribute('data-target-plugin-name') || 'Plugin editor';
        var region = evSrc.getAttribute('data-target-region');
        var pageId = evSrc.getAttribute('data-target-page-id');
        var dataId = evSrc.getAttribute('data-target-data-id');

        var iframeSrc = '/_static/plugins/' + plugin + '/edit.html';
        var startEl = document.querySelectorAll('[data-region=' + region + ']')[0];
        var iframe = launchIframeModal(iframeSrc, 'pagespace-editor', pluginName, startEl, 'full');

        //inject plugin interface
        iframe.contentWindow.window.pagespace = getPluginInterface(pageId, dataId);
    }

    /**
     * Launch add
     * @param evSrc
     */
    function launchAddInclude(evSrc) {

        var pageId = evSrc.getAttribute('data-target-page-id');
        var region = evSrc.getAttribute('data-target-region');

        var iFrameName = 'add_include';
        var iframeSrc = '/_dashboard/inpage#/add-include/' + pageId + '/' + region;
        var startEl = document.querySelectorAll('[data-region=' + region + ']')[0];
        var title = 'Add include';
        launchIframeModal(iframeSrc, iFrameName, title, startEl, 'medium');
    }

    /**
     * Launch iframe
     * @param src
     * @param frameName
     * @param title
     * @param startEl
     * @return {*}
     */
    function launchIframeModal(src, frameName, title, startEl, size) {

        //create the modal
        var modal = document.createElement('div');
        modal.id = 'include-modal';
        modal.className = 'ps-include-modal';

        document.body.appendChild(modal);

        //create the editor frame
        var editor = document.createElement('div');
        editor.id = 'include-editor';
        editor.className = 'ps-include-editor';

        var regionPos = startEl.getBoundingClientRect();
        editor.style.left = regionPos.left + 'px';
        editor.style.top = regionPos.top + 30 + 'px';
        editor.style.width = regionPos.width + 'px';
        editor.style.height = regionPos.height + 'px';

        //document.body.appendChild(editor);
        modal.appendChild(editor);

        //create the iframe
        var iframe = document.createElement('iframe');
        iframe.name = frameName;
        iframe.src = src;
        iframe.width = '100%';
        iframe.height = '100%';
        editor.appendChild(iframe);

        //titlebar
        var titleBar = document.createElement('div');
        titleBar.classList.add('ps-include-editor-titlebar');
        titleBar.innerHTML = '<p>' + title + '</p>';

        //close button
        var closeBtn = document.createElement('button');
        closeBtn.classList.add('ps-include-editor-close');
        closeBtn.classList.add('ps-btn');
        closeBtn.setAttribute('title', 'Close without saving');
        closeBtn.innerHTML = '<img src=/_static/dashboard/support/icons/cross-mark1.svg width=12 height=12 alt=Close>';

        titleBar.appendChild(closeBtn);

        editor.appendChild(titleBar);

        //animate to size
        window.setTimeout(function() {
            setIframeSize(editor, size);
        }, 300);


        function setIframeSize(editor, size) {
            if(editor) {
                var top, height;
                if(size === 'small') {
                    top = 200;
                    height = window.innerHeight - 400;
                } else if(size === 'medium') {
                    top = 100;
                    height = window.innerHeight - 200;
                } else {
                    top = 30;
                    height = window.innerHeight - 30;

                }

                document.body.style.overflow = 'hidden';

                var maxLeft = (window.innerWidth / 12) * 2;
                editor.style.top = top + 'px';
                editor.style.left = window.innerWidth < 1000 ? 0 : maxLeft + 'px';
                editor.style.width = window.innerWidth < 1000 ?
                    window.innerWidth + 'px' : window.innerWidth - (maxLeft * 2) + 'px';
                editor.style.height = height+ 'px';
            }
        }
        var resizeListener = function() {
            setIframeSize(editor, size);
        };

        window.addEventListener('resize', resizeListener);

        closeBtn.addEventListener('click', function() {
            window.removeEventListener('resize', resizeListener);
            editor.parentNode.parentNode.removeChild(modal);
            document.body.style.overflow = 'auto';
        });

        return iframe;
    }

    /**
     * Plugin Interface
     * @param plugin
     * @param pageId
     * @param region
     * @param include
     * @return {{getData: getData, setData: setData, close: close}}
     */
    function getPluginInterface(pageId, dataId) {
        return {
            getKey: function() {
                return dataId;
            },
            getData: function() {
                console.info('Pagespace getting data for %s', dataId);
                return fetch('/_api/datas/' + dataId, {
                    credentials: 'same-origin',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    },
                }).then(function(res) {
                    return res.json();
                }).then(function(data) {
                    return data.data;
                });
            },
            setData: function(data) {
                console.info('Pagespace setting data for %s', dataId);
                var updateData = fetch('/_api/datas' + dataId, {
                    method: 'put',
                    credentials: 'same-origin',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        data: data
                    })
                });
                var updatePage = fetch('/_api/pages' + pageId, {
                    method: 'put',
                    credentials: 'same-origin',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        draft: true
                    })
                });

                return Promise.all([ updateData, updatePage ]).then(function() { // jshint ignore:line
                    return {
                        status: 'ok'
                    };
                });
            },
            close: function() {
                console.info('Pagespace closing plugin editor for %s', dataId);
                window.parent.location.reload();
            }
        };
    }

})();