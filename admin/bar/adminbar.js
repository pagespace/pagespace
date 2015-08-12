(function() {

    document.addEventListener("DOMContentLoaded", function setupEditMode() {

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

            var editPartMatch = e.target.hasAttribute('data-part');
            if(editPartMatch) {
                launchPartEditor();
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
                var boxHoverRule = cssRulesArray.filter(function(rule) {
                    return rule.selectorText === '.ps-edit-box:hover';
                })[0];
                boxHoverRule.style.outlineColor = sidebarColor

                var editButtonRule = cssRulesArray.filter(function(rule) {
                    return rule.selectorText === '.ps-edit-box .ps-edit';
                })[0];
                editButtonRule.style.backgroundColor = sidebarColor;
            }
        } catch(e) {
            console.warn(e);
        }
    }

    function decorateParts() {
        //add edit buttons
        var editButton = document.createElement('button');
        editButton.innerText = 'e';
        editButton.setAttribute('data-part', true);
        editButton.classList.add('ps-edit');

        Array.prototype.slice.call(document.querySelectorAll('[data-part]')).forEach(function(part) {
            part.insertBefore(editButton, part.firstChild);
            part.classList.add('ps-edit-box');
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

    function launchPartEditor() {

    }

})();