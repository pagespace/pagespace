//support
var bunyan = require('bunyan');

//util
var logger =  bunyan.createLogger({ name: 'logout-handler' });
logger.level('debug');

var LogoutHandler = function() {
};

module.exports = function() {
    return new LogoutHandler();
};

LogoutHandler.prototype.doRequest = function(req, res, next) {

    logger.info('Processing logout request for ' + req.url);

    if(req.method === 'GET' || req.method === 'POST') {
        req.logout();
        res.clearCookie('remember_me');
        res.redirect('/_login');
    }
};