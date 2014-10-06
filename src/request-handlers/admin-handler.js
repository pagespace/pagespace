//support
var bunyan = require('bunyan');
var util = require('../util');

//util
var consts = require('../app-constants');
var logger =  bunyan.createLogger({ name: 'admin-handler' });
logger.level('debug');

var AdminHandler = function() {
};

module.exports = function() {
    return new AdminHandler();
};

AdminHandler.prototype.doRequest = function(req, res, next) {
    logger.info('Processing admin request for ' + req.url);

    //check for power mode
    if(req.query._power) {
        if(req.user && req.user.role === 'admin' && util.typeify(req.query._power) === true) {
            logger.debug("Switching power mode on");
            req.session.power = true;
        } else if(util.typeify(req.query._power) === false) {
            logger.debug("Switching power  mode off");
            req.session.power = false;
        }
    }

    var apiInfo = consts.requestRegex.ADMIN.exec(req.url);
    var adminType = apiInfo[1];

    var pageData = {
        powerMode: (req.session.power || false).toString()
    };
    return res.render(adminType, pageData, function(err, html) {
        if(err) {
            logger.error(err);
            next(err);
        } else {
            logger.info('Sending page for %s', req.url);
            res.send(html);
        }
    });
};