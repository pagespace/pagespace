(function() {

    var edit = window._editMode || false;

    document.addEventListener("DOMContentLoaded", addAdminbar);
    function addAdminbar() {
        var adminbarHtml =
            '<div id="adminbar" class="adminbar">' +
                '<div class="adminbar-links">' +
                    '<a href="/_admin/dashboard">Dashboard</a>' +
                '</div>' +
                '<div class="adminbar-actions">' +
                    '<div>' +
                        '<a href="/_logout">Logout</a>' +
                    '</div>' +
                    '<div class="switch">' +
                        '<button id="edit-switch" class="edit-switch" value="' + (edit ? 'false' : 'true') + '">Editing</button>' +
                    '</div>' +
                '</div>' +
            '</div>';

        document.body.innerHTML = adminbarHtml + document.body.innerHTML;
        document.getElementById('edit-switch').addEventListener('click', function(e) {
            var editVal = e.target.value;
            var path = window.location.pathname;
            var hash = window.location.hash;
            var query = window.location.search;
            query = query.replace(/^\?/, '');
            var params = query.split('&');
            var editReplaced = false;
            params = params.map(function(val) {
                if(val.indexOf('_edit=') > -1) {
                    editReplaced = true;
                    return '_edit=' + editVal
                } else {
                    return val;
                }
            });
            if(!editReplaced) {
                params.push('_edit=' + editVal);
            }

            query = '?' + params.join('&');
            window.location.replace(path + query + hash);
        });
    }
})();