window.pagespace = window.pagespace || {};
window.pagespace.getPluginInterface = function getPluginInterface(pluginName, pageId, includeId) {
    return {
        getKey: function() {
            return includeId;
        },
        
        getConfig: function() {
            console.info('Pagespace getting config for %s', pluginName);
            return fetch('/_api/plugins', {
                credentials: 'same-origin',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            }).then(function(res) {
                return res.json();
            }).then(function(data) {
                return data.filter(function(plugin) {
                    return plugin.name === pluginName;
                })[0].config;
            });
        },
        
        getData: function() {
            console.info('Pagespace getting data for %s', includeId);
            return fetch('/_api/includes/' + includeId, {
                credentials: 'same-origin',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            }).then(function(res) {
                return res.json();
            }).then(function(include) {
                return include.data || {};
            });
        },
        
        setData: function(data) {
            console.info('Pagespace setting data for %s', includeId);
            var updateData = fetch('/_api/includes/' + includeId, {
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
            var updatePage = fetch('/_api/pages/' + pageId, {
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
            console.info('Pagespace closing plugin editor');
        },

        _events: {},
        on: function (event, listener) {
            if (typeof this._events[event] !== 'object') {
                this._events[event] = [];
            }

            this._events[event].push(listener);
        },
        emit: function (event) {
            var i, listeners, length, args = [].slice.call(arguments, 1);

            if (typeof this._events[event] === 'object') {
                listeners = this._events[event].slice();
                length = listeners.length;

                for (i = 0; i < length; i++) {
                    listeners[i].apply(this, args);
                }
            }
        }
    };
};