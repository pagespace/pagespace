'use strict';

var Promise = require('bluebird');

var log = pagespace.logger;

module.exports = {
    process: function(data) {

        return Promise.resolve(data);
    }
};