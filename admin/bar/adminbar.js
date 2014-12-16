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
    }

})();