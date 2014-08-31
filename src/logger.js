var chalk = require('chalk');

var Logger = function(module, level) {
    this.module = module;
    this.level = level || Logger.levels.INFO;
    this.lastLevel = 0;
};

Logger.levels = {
    LOG: 0,
    DEBUG: 1,
    INFO: 2,
    WARNING: 3,
    ERROR: 4
};

Logger.meta = {
    "0" : {
        color: chalk.reset,
        prefix: "LOG: "
    },
    "1" : {
        color: chalk.green,
        prefix: "DEBUG: "
    },
    "2" : {
        color: chalk.blue,
        prefix: "INFO: "
    },
    "3" : {
        color: chalk.orange,
        prefix: "WARN: "
    },
    "4" : {
        color: chalk.red,
        prefix: "ERROR: "
    }
};


Logger.prototype._out = function(level, args) {
    this.lastLevel = level;
    var meta = Logger.meta[level];
    args[0] = meta.color(timestamp() + this.module + "\n" + meta.prefix + args[0]);

    var method = level === Logger.levels.ERROR ? console.error : console.log;
    method.apply(null, Array.prototype.slice.call(args, 0));
};

Logger.prototype.log = function(message) {

    this._out(Logger.levels.LOG, arguments);
};

Logger.prototype.append = function() {

    if(this.level <= this.lastLevel) {
        var meta = Logger.meta[this.lastLevel];
        arguments[0] = meta.color("\t" + arguments[0]);
        console.log.apply(null, Array.prototype.slice.call(arguments, 0));
    }
};

Logger.prototype.debug = function() {

    if(this.isDebug()) {
       this._out(Logger.levels.DEBUG, arguments);
    }
};

Logger.prototype.info = function() {

    if(this.isInfo()) {
        this._out(Logger.levels.INFO, arguments);
    }
};

Logger.prototype.warn = function() {

    if(this.isWarning()) {
        this._out(Logger.levels.WARNING, arguments);
    }
};

Logger.prototype.error = function() {

    if(this.isError()) {
        this._out(Logger.levels.ERROR, arguments);
    }
};

Logger.prototype.isDebug = function() {

    return this.level <= Logger.levels.DEBUG;
};

Logger.prototype.isInfo = function() {

    return this.level <= Logger.levels.INFO;
};

Logger.prototype.isWarning = function() {

    return this.level <= Logger.levels.WARNING;
};

Logger.prototype.isError = function() {

    return this.level <= Logger.levels.ERROR;
};

function timestamp() {
    return new Date().toISOString();
}

var loggerFactory = function(level) {

    level = typeof level === "string" ? Logger.levels[level.toUpperCase()] : Logger.levels.INFO;
    return new Logger(module.parent.id, level);
};

module.exports = loggerFactory;