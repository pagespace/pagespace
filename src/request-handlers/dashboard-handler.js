'use strict';

var DashboardHandler = function(support) {
    this.logger = support.logger.child({module: 'dashboard-handler'});
};

module.exports = function(support) {
    return new DashboardHandler(support);
};

DashboardHandler.prototype._doRequest = function(req, res, next) {

    var logger = this.logger;

    logger.info('Processing admin request for %s', req.url);

    var pageData = {
        role: req.user.role,
        username: req.user.username
    };

    return res.render('dashboard.hbs', pageData, function(err, html) {
        if(err) {
            logger.error(err, 'Error trying to render dashboard page, %s', req.url);
            next(err);
        } else {
            logger.info('Sending page for %s', req.url);
            res.send(html);
        }
    });
};