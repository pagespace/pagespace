(function() {

    window.pagespace = window.pagespace || {};
    window.pagespace.setupAdminMode = function() {
        //adds various admin functionality to a page
        handleAdminEvents();
        syncColors();
        decorateIncludes();
    };

    function getPluginInterface(plugin, pageId, region, include) {
        var query = '?pageId=' + encodeURIComponent(pageId) +'&region=' + encodeURIComponent(region) + '&include=' + encodeURIComponent(include);
        return {
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
                    }
                })
            },
            close: function() {
                console.info('Pagespace closing plugin editor for %s', plugin);
                window.parent.location.reload();
            }
        };
    }

    function handleAdminEvents() {

        //listen for clicks that bubble in up in the admin bar
        document.body.addEventListener('click', function (e) {

            var switchMatch = e.target.className && /(^|\s)switch(\s|$)/.test(e.target.className);
            if (switchMatch) {
                var paramName = e.target.name;
                var paramVal = e.target.value;
                updateQueryParam(paramName, paramVal);
            }

            var editIncludeMatch = e.target.hasAttribute('data-target-region');
            if(editIncludeMatch) {
                launchPluginEditor(e.target);
            }
        });
    }

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
                    return rule.selectorText === '.ps-edit-box:hover';
                })[0];
                boxHoverRule.style.outlineColor = specialColor

                //edit button rules
                var editButtonRule = cssRulesArray.filter(function(rule) {
                    return rule.selectorText === '.ps-edit-box .ps-edit';
                })[0];
                editButtonRule.style.backgroundColor = specialColor;

                var closeEditButton = cssRulesArray.filter(function(rule) {
                    return rule.selectorText === '.ps-include-editor-close';
                })[0];
                closeEditButton.style.backgroundColor = specialColor;
            }
        } catch(e) {
            console.warn(e);
        }
    }

    function decorateIncludes() {

        function createEditButton(plugin, pageId, region, include) {
            //add edit buttons
            var editButton = document.createElement('button');
            editButton.innerHTML =
                '<img src=/_static/dashboard/support/icons/pencil41.svg width=16 height=16 alt="Edit Include" title="Edit Include"' +
                'data-target-plugin=' + plugin + ' data-target-page-id=' + pageId + ' data-target-region=' + region + ' data-target-include=' + include + '>';
            editButton.setAttribute('data-target-plugin', plugin);
            editButton.setAttribute('data-target-page-id', pageId);
            editButton.setAttribute('data-target-region', region);
            editButton.setAttribute('data-target-include', include);
            editButton.classList.add('ps-edit');
            return editButton;
        }

        Array.prototype.slice.call(document.querySelectorAll('[data-region]')).forEach(function(region) {
            //TODO: less intrusive way of getting page id
            var button = createEditButton(region.getAttribute('data-plugin'), region.getAttribute('data-page-id'), region.getAttribute('data-region'), region.getAttribute('data-include'));
            region.insertBefore(button, region.firstChild);
            region.classList.add('ps-edit-box');
        });
    }

    function updateQueryParam(paramName, newVal) {
        var path = window.location.pathname;
        var hash = window.location.hash;
        var query = window.location.search;
        query = query.replace(/^\?/, '');
        var params = query.split('&');
        var paramReplaced = false;
        params = params.map(function (val) {
            if (val.indexOf(paramName + '=') === 0) {
                paramReplaced = true;
                return encodeURIComponent(paramName) + '=' + encodeURIComponent(newVal);
            } else {
                return val;
            }
        });
        if (!paramReplaced) {
            params.push(paramName + '=' + newVal);
        }

        query = '?' + params.join('&');
        window.location.replace(path + query + hash);
    }

    function launchPluginEditor(evSrc) {

        var plugin = evSrc.getAttribute('data-target-plugin');
        var pageId = evSrc.getAttribute('data-target-page-id');
        var region = evSrc.getAttribute('data-target-region');
        var include = evSrc.getAttribute('data-target-include');

        //create the modal
        var modal = document.createElement('div');
        modal.id = 'include-modal';
        modal.className = 'ps-include-modal';

        document.body.appendChild(modal);

        //create the editor frame
        var editor = document.createElement('div');
        editor.id = 'include-editor';
        editor.className = 'ps-include-editor';

        var regionNode = document.querySelectorAll('[data-region=' + region + ']')[0];
        var regionPos = getAbsolutePosition(regionNode);
        editor.style.top = regionPos.top + 'px';
        editor.style.left = regionPos.left + 'px';
        editor.style.width = regionPos.width + 'px';
        editor.style.height = regionPos.height + 'px';

        //document.body.appendChild(editor);
        modal.appendChild(editor);

        //create the iframe
        var iframe = document.createElement('iframe');
        iframe.name = region + '_' + plugin + '_' + include;
        iframe.src = '/_plugins/static/' + plugin + '/edit.html';
        iframe.width = '100%';
        iframe.height = '100%';
        iframe.seamlesss = true;
        editor.appendChild(iframe);

        //inject plugin interface
        iframe.contentWindow.window.pagespace = getPluginInterface(plugin, pageId, region, include);

        //close button
        var closeBtn = document.createElement('button');
        closeBtn.classList.add('ps-include-editor-close');
        closeBtn.classList.add('ps-btn');
        closeBtn.innerHTML = '<img src=/_static/dashboard/support/icons/cross-mark1.svg width=12 height=12 alt=Close title=Close>';

        editor.appendChild(closeBtn);
        closeBtn.addEventListener('click', function() {
            editor.parentNode.parentNode.removeChild(modal);
            document.body.style.overflow = 'auto';
        });

        //animate to size
        window.setTimeout(function() {
            document.body.style.overflow = 'hidden';

            editor.style.top = 30 + 'px';
            editor.style.left = ((window.innerWidth - 1000) / 2) + 'px';
            editor.style.width = 1000 + 'px';
            editor.style.height = (window.innerHeight - 60) + 'px';
        }, 300);

    }

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
            return getAbsolutePosition(node.offsetParent, offset)
        } else {
            return offset;
        }
    }

})();