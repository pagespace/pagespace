'use strict';

var instance = null;

var LogLevel = function() {
    this.level = 'info';
};

module.exports = function() {
    if(!instance) {
        instance = new LogLevel();
    }
    return instance;
};

LogLevel.prototype.get = function() {
    return this.level;
};
LogLevel.prototype.set = function(level) {
    this.level = level;
};