'use strict';

var entityMap = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    '\'': '&#39;',
    '/': '&#x2F;'
};

module.exports = {

    /**
     * Attempts to co-erce an intended type of a string value
     * @param value
     * @returns {*}
     */
    typeify: function typeify(value) {
        if(typeof value === 'undefined' || value === null) {
            return null;
        } else if(!isNaN(parseFloat(+value))) {
            return parseFloat(value);
        } else if(value.toLowerCase() === 'false') {
            return false;
        } else if(value.toLowerCase() === 'true') {
            return true;
        } else {
            return value;
        }
    },

    /**
     * Simple escape html function (take from Mustache)
     * @param value
     * @returns {*}
     */
    escapeHtml: function(value) {
        if(typeof value === 'string') {
            return value.replace(/[&<>"'\/]/g, function (s) {
                return entityMap[s];
            });
        } else {
            return value;
        }
    },

    htmlStringify: function(obj) {
        var html =
            '<pre style="font-family: Consolas, \'Courier New\'">' +
                this.escapeHtml(JSON.stringify(obj, null, 4)) +
            '</pre>';
        return html;
    },

    /**
     * Generates a random string
     * @returns {string}
     */
    randomId: function() {
        return Math.random().toString(36).substring(7);
    }
};