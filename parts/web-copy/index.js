'use strict';

module.exports = {
    process: function(data) {
        if(!data) {
            data = '<!-- Web copy -->';
        }
        return data;
    }
};