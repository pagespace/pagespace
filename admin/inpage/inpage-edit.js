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

            var target;

            if(ev.target.hasAttribute('data-edit-include')) {
                target = ev.target.tagName.toUpperCase() === 'IMG' ? ev.target.parentNode : ev.target;
                launchPluginEditor(target);
            } else if(ev.target.hasAttribute('data-remove-include')) {
                target = ev.target.tagName.toUpperCase() === 'IMG' ? ev.target.parentNode : ev.target;
                launchRemoveInclude(target);
            } else if(ev.target.hasAttribute('data-add-include')) {
                target = ev.target.tagName.toUpperCase() === 'IMG' ? ev.target.parentNode : ev.target;
                launchAddInclude(target);
            }
        });

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

                //remove button
                var removeButtonRule = cssRulesArray.filter(function(rule) {
                    return rule.selectorText === '.ps-box .ps-remove';
                })[0];
                removeButtonRule.style.backgroundColor = specialColor;

                //add button
                var addButtonRule = cssRulesArray.filter(function(rule) {
                    return rule.selectorText === '.ps-box .ps-add';
                })[0];
                addButtonRule.style.backgroundColor = specialColor;
            }
        } catch(e) {
            console.warn(e);
        }
    }

    /**
     * Decorate includes
     */
    function decorateIncludes() {

        function createEditButton(plugin, pluginName, pageId, region, include) {

            //add edit buttons
            var editButttonIcon = document.createElement('img');
            editButttonIcon.src = '/_static/dashboard/support/icons/pencil41.svg';
            editButttonIcon.width = 16;
            editButttonIcon.height = 16;
            editButttonIcon.setAttribute('data-edit-include', 'data-edit-include');

            var editButton = document.createElement('button');
            editButton.setAttribute('data-edit-include', 'data-edit-include');
            editButton.setAttribute('data-target-plugin', plugin);
            editButton.setAttribute('data-target-plugin-name', pluginName);
            editButton.setAttribute('data-target-page-id', pageId);
            editButton.setAttribute('data-target-region', region);
            editButton.setAttribute('data-target-include', include);
            editButton.setAttribute('title', 'Edit include');
            editButton.classList.add('ps-edit');
            editButton.appendChild(editButttonIcon);

            return editButton;
        }

        function createRemoveButton(pageId, region, include) {

            //remove buttons
            var removeButtonIcon = document.createElement('img');
            removeButtonIcon.src = '/_static/dashboard/support/icons/1443751567_icon-minus-round.svg';
            removeButtonIcon.width = 16;
            removeButtonIcon.height = 16;
            removeButtonIcon.setAttribute('data-remove-include', 'data-remove-include');

            var removeButton = document.createElement('button');
            removeButton.setAttribute('data-remove-include', 'data-remove-include');
            removeButton.setAttribute('data-target-page-id', pageId);
            removeButton.setAttribute('data-target-region', region);
            removeButton.setAttribute('data-target-include', include);
            removeButton.setAttribute('title', 'Remove include');
            removeButton.classList.add('ps-remove');
            removeButton.appendChild(removeButtonIcon);

            return removeButton;
        }

        Array.prototype.slice.call(document.querySelectorAll('[data-region]')).forEach(function(include) {
            var editButton = createEditButton(include.getAttribute('data-plugin'),
                include.getAttribute('data-plugin-name'),
                include.getAttribute('data-page-id'),
                include.getAttribute('data-region'),
                include.getAttribute('data-include'));
            include.insertBefore(editButton, include.firstChild);

            var removeButton = createRemoveButton(include.getAttribute('data-page-id'),
                include.getAttribute('data-region'),
                include.getAttribute('data-include'));
            include.insertBefore(removeButton, include.firstChild);

            include.classList.add('ps-box');
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

            //add include buttons
            var addButtonIcon = document.createElement('img');
            addButtonIcon.src = '/_static/dashboard/support/icons/1443751631_icon-plus-round.svg';
            addButtonIcon.width = 16;
            addButtonIcon.height = 16;
            addButtonIcon.setAttribute('data-add-include', pageId);

            var addButton = document.createElement('button');
            addButton.setAttribute('data-add-include', pageId);
            addButton.setAttribute('data-target-page-id', pageId);
            addButton.setAttribute('data-target-region', region);
            addButton.setAttribute('title', 'Add include');
            addButton.classList.add('ps-add');
            addButton.appendChild(addButtonIcon);

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
        var pageId = evSrc.getAttribute('data-target-page-id');
        var region = evSrc.getAttribute('data-target-region');
        var include = evSrc.getAttribute('data-target-include');

        var iFrameName = region + '_' + plugin + '_' + include;
        var iframeSrc = '/_plugins/static/' + plugin + '/edit.html';
        var startEl = document.querySelectorAll('[data-region=' + region + ']')[0];
        var iframe = launchIframeModal(iframeSrc, iFrameName, pluginName, startEl, 'full');

        //inject plugin interface
        iframe.contentWindow.window.pagespace = getPluginInterface(plugin, pageId, region, include);
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
     * Launch remove
     * @param evSrc
     */
    function launchRemoveInclude(evSrc) {

        var pageId = evSrc.getAttribute('data-target-page-id');
        var region = evSrc.getAttribute('data-target-region');
        var include = evSrc.getAttribute('data-target-include');

        var iFrameName = 'remove_include';
        var iframeSrc = '/_dashboard/inpage#/remove-include/' + pageId + '/' + region + '/' + include;
        var startEl = document.querySelectorAll('[data-region=' + region + ']')[0];
        var title = 'Remove include';
        launchIframeModal(iframeSrc, iFrameName, title, startEl, 'small');
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

        var regionPos = getAbsolutePosition(startEl);
        editor.style.top = regionPos.top + 30 + 'px';
        editor.style.left = regionPos.left + 'px';
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
    function getPluginInterface(plugin, pageId, region, include) {
        var query = '?pageId=' + encodeURIComponent(pageId) +
            '&region=' + encodeURIComponent(region) +
            '&include=' + encodeURIComponent(include);
        return {
            getKey: function() {
                return plugin + '_' + pageId + '_' + region + '_' + include;
            },
            getData: function() {
                console.info('Pagespace getting data for %s', plugin);
                return fetch('/_plugins/data' + query, {
                    credentials: 'same-origin'
                }). then(function(res) {
                    return res.json();
                });
            },
            setData: function(data) {
                console.info('Pagespace setting data for %s', plugin);
                return fetch('/_plugins/data' + query, {
                    method: 'put',
                    credentials: 'same-origin',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(data)
                }).then(function() {
                    return {
                        status: 'ok'
                    };
                });
            },
            close: function() {
                console.info('Pagespace closing plugin editor for %s', plugin);
                window.parent.location.reload();
            }
        };
    }

    /**
     * Util: getAbsolute position
     * @param node
     * @param offset
     * @return {*}
     */
    function getAbsolutePosition(node, offset) {

        offset = offset || {
            left: 0,
            top: 0,
            width: node.offsetWidth,
            height: node.offsetHeight
        };

        if(node.offsetParent) {
            offset.left += node.offsetLeft;
            offset.top += node.offsetTop;
            return getAbsolutePosition(node.offsetParent, offset);
        } else {
            return offset;
        }
    }

})();