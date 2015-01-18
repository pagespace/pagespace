(function() {

    document.addEventListener("DOMContentLoaded", addAdminbar);
    function addAdminbar() {
        var adminbarHtml = document.getElementById('adminbar-html').innerHTML;

        document.body.innerHTML = adminbarHtml + document.body.innerHTML;

        document.body.addEventListener('click', function (e) {

            var match = e.target.className && /(^|\s)switch(\s|$)/.test(e.target.className);
            if (match) {
                var paramName = e.target.name;
                var paramVal = e.target.value;
                updateQueryParam(paramName, paramVal);
            }
        });

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

        //change the sidebar color stuff
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
                var cssRule = cssRulesArray.filter(function(rule) {
                    return rule.selectorText === '.ps-edit-box';
                })[0];
                cssRule.style.outlineColor = sidebarColor;
            }
        } catch(e) {
            console.warn(e);
        }

    }

})();