(function() {

    window.pagespace = window.pagespace || {};
    window.pagespace.setupAdminMode = function() {
        //adds various admin functionality to a page
        handleAdminEvents();
        syncColors();
        decorateParts();
    };

    function getPartInterface(part, pageId, region) {
        var query = '?pageId=' + encodeURIComponent(pageId) +'&region=' + encodeURIComponent(region);
        return {
            getData: function() {
                console.info('Pagespace getting data for %s', part);
                return fetch('/_parts/data' + query, {
                    credentials: 'same-origin'
                }). then(function(res) {
                    return res.json();
                });
            },
            setData: function(data) {
                console.info('Pagespace setting data for %s', part);
                return fetch('/_parts/data' + query, {
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
                console.info('Pagespace closing part editor for %s', part);
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

            var editPartMatch = e.target.hasAttribute('data-target-region');
            if(editPartMatch) {
                launchPartEditor(e.target);
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
                    return rule.selectorText === '.ps-part-editor-close';
                })[0];
                closeEditButton.style.backgroundColor = specialColor;
            }
        } catch(e) {
            console.warn(e);
        }
    }

    function decorateParts() {

        function createEditButton(part, pageId, region) {
            //add edit buttons
            var editButton = document.createElement('button');
            editButton.innerHTML =
                '<img src=/_static/dashboard/support/icons/pencil41.svg width=16 height=16 alt="Edit Part" title="Edit Part"' +
                'data-target-part=' + part + ' data-target-page-id=' + pageId + ' data-target-region=' + region + '>';
            editButton.setAttribute('data-target-part', part);
            editButton.setAttribute('data-target-page-id', pageId);
            editButton.setAttribute('data-target-region', region);
            editButton.classList.add('ps-edit');
            return editButton;
        }

        Array.prototype.slice.call(document.querySelectorAll('[data-region]')).forEach(function(region) {
            //TODO: less intrusive way of getting page id
            var button = createEditButton(region.getAttribute('data-part'), region.getAttribute('data-page-id'), region.getAttribute('data-region'));
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

    function launchPartEditor(evSrc) {

        var part = evSrc.getAttribute('data-target-part');
        var pageId = evSrc.getAttribute('data-target-page-id');
        var region = evSrc.getAttribute('data-target-region');

        //create the editor frame
        var editor = document.createElement('div');
        editor.id = 'part-editor';
        editor.className = 'ps-part-editor';

        var regionNode = document.querySelectorAll('[data-region=' + region + ']')[0];
        var regionPos = getAbsolutePosition(regionNode);
        editor.style.top = regionPos.top + 'px';
        editor.style.left = regionPos.left + 'px';
        editor.style.width = regionPos.width + 'px';
        editor.style.height = regionPos.height + 'px';

        document.body.appendChild(editor);

        //create the iframe
        var iframe = document.createElement('iframe');
        iframe.name = region + '_' + part;
        //iframe.src = '/_dashboard/region?pageId=' + encodeURIComponent(pageId) +'&region=' + encodeURIComponent(region);
        iframe.src = '/_parts/static/' + part + '/edit.html';
        iframe.width = '100%';
        iframe.height = '100%';
        iframe.seamlesss = true;
        editor.appendChild(iframe);

        //inject part interface
        //iframe.contentWindow.window.pagesapce = getPartInterface(part, pageId, region);;
        iframe.contentWindow.window.pagespace = getPartInterface(part, pageId, region);

        //close button
        var closeBtn = document.createElement('button');
        closeBtn.classList.add('ps-part-editor-close');
        closeBtn.classList.add('ps-btn');
        closeBtn.innerHTML = '<img src=/_static/dashboard/support/icons/cross-mark1.svg width=12 height=12 alt=Close title=Close>';

        editor.appendChild(closeBtn);
        closeBtn.addEventListener('click', function() {
            editor.parentNode.removeChild(editor);
        });

        //animate to size
        window.setTimeout(function() {
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

            //account for margin on the html doc
            var htmlNode = document.getElementsByTagName('html')[0];
            var margin = window.getComputedStyle(htmlNode)['margin-top'];
            if(margin) {
                offset.top += parseInt(margin);
            }

            return offset;
        }
    }

})();