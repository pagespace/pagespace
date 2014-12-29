'use strict';


var LogoutHandler = function(support) {
    this.logger = support.logger.child({module:'logout-handler'});
};

module.exports = function(support) {
    return new LogoutHandler(support);
};

LogoutHandler.prototype._doRequest = function(req, res) {

    var logger = this.logger;

    logger.info('Processing logout request for ' + req.url);

    if(req.method === 'GET' || req.method === 'POST') {
        req.logout();
        res.clearCookie('remember_me');
        return res.redirect('/_login');
    }
};