'use strict';


/**
 * Attempts to coerce an intended type of a string value
 * @param value
 * @returns {*}
 */
module.exports = (value) => {
    if(typeof value === 'undefined' || value === null) {
        return null;
    } else if(!isNaN(parseFloat(+value))) {
        return parseFloat(value);
    } else if(value.toLowerCase() === 'false') {
        return false;
    } else if(value.toLowerCase() === 'true') {
        return true;
    } else if(value.length > 2 && value.indexOf('/') === 0 && value.lastIndexOf('/') === value.length - 1) {
        return new RegExp(value.substring(1, value.length - 1));
    } else {
        return value;
    }
};