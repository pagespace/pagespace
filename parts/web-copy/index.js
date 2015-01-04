'use strict';

module.exports = {
    viewPartial: null,
    init: function(viewPartial) {
        this.viewPartial = viewPartial;
    },
    process: function(data) {
        if(!data) {
            data = '<!-- Web copy -->';
        }
        return data;
    }
};