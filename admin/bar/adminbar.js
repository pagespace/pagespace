(function() {

    document.addEventListener("DOMContentLoaded", function setupEditMode() {

        //adds various admin functionality to a page
        addAdminBar();
        handleAdminEvents();
        syncColors();
        decorateParts();
    });


    function addAdminBar() {

        var adminbarHtml = document.getElementById('adminbar-html').innerHTML;
        document.body.innerHTML = adminbarHtml + document.body.innerHTML;
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
            var sidebarColor = window.localStorage.getItem('sidebarColor');
            if(sidebarColor) {
                document.getElementById('adminbar').style.backgroundColor = sidebarColor;

                var styleSheetsArray = Array.prototype.slice.call(document.styleSheets);
                var styleSheet= styleSheetsArray.filter(function(styleSheet) {
                    return styleSheet.href && styleSheet.href.indexOf('adminbar.css') > -1;
                })[0];
                var cssRules = styleSheet.cssRules;
                var cssRulesArray = Array.prototype.slice.call(cssRules);

                //box hover colors
                var boxHoverRule = cssRulesArray.filter(function(rule) {
                    return rule.selectorText === '.ps-edit-box:hover';
                })[0];
                boxHoverRule.style.outlineColor = sidebarColor

                //edit button rules
                var editButtonRule = cssRulesArray.filter(function(rule) {
                    return rule.selectorText === '.ps-edit-box .ps-edit';
                })[0];
                editButtonRule.style.backgroundColor = sidebarColor;

                var closeEditButton = cssRulesArray.filter(function(rule) {
                    return rule.selectorText === '.ps-part-editor-close';
                })[0];
                closeEditButton.style.backgroundColor = sidebarColor;
            }
        } catch(e) {
            console.warn(e);
        }
    }

    function decorateParts() {

        function createEditButton(regionId) {
            //add edit buttons
            var editButton = document.createElement('button');
            editButton.innerText = 'e';
            editButton.setAttribute('data-target-region', regionId);
            editButton.classList.add('ps-edit');
            return editButton;
        }

        Array.prototype.slice.call(document.querySelectorAll('[data-region]')).forEach(function(region) {
            var button = createEditButton(region.getAttribute('data-region'));
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

        var regionId = evSrc.getAttribute('data-target-region');

        //create the editor frame
        var editor = document.createElement('div');
        editor.id = 'part-editor';
        editor.className = 'ps-part-editor';

        var regionNode = document.querySelectorAll('[data-region=' + regionId + ']')[0]
        var regionPos = getAbsolutePosition(regionNode);
        editor.style.top = regionPos.top + 'px';
        editor.style.left = regionPos.left + 'px';
        editor.style.width = regionPos.width + 'px';
        editor.style.height = regionPos.height + 'px';

        document.body.appendChild(editor);

        //create the iframe
        var iframe = document.createElement('iframe');
        iframe.src = 'http://localhost:9999/_dashboard';
        iframe.width = '100%';
        iframe.height = '100%';
        iframe.seamlesss = true;
        editor.appendChild(iframe);

        //close button
        var closeBtn = document.createElement('button');
        closeBtn.classList.add('ps-part-editor-close');
        closeBtn.classList.add('ps-btn');
        closeBtn.innerText = 'x';
        editor.appendChild(closeBtn);
        closeBtn.addEventListener('click', function() {
            editor.parentNode.removeChild(editor);
        });

        //animate to size
        window.setTimeout(function() {
            editor.style.top = 50 + 'px';
            editor.style.left = ((window.innerWidth - 800) / 2) + 'px';
            editor.style.width = 800 + 'px';
            editor.style.height = (window.innerHeight - 100) + 'px';
        }, 100);

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