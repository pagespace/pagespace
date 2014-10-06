//support
var bunyan = require('bunyan');
var passport = require('passport');

//util
var logger =  bunyan.createLogger({ name: 'login-handler' });
logger.level('debug');

var LoginHandler = function() {
};

module.exports = function() {
    return new LoginHandler();
};

LoginHandler.prototype.doRequest = function(req, res, next) {

    logger.info('Processing login request for ' + req.url);

    if(req.method === 'GET') {
        return res.render('login', {}, function(err, html) {
            if(err) {
                logger.error(err);
                next(err);
            } else {
                logger.info('Sending page for %s', req.url);
                res.send(html);
            }
        });
    } else if(req.method === 'POST') {
        return passport.authenticate('local', function(err, user, info) {
            if (err) {
                return next(err);
            }
            if (!user) {
                return res.redirect('/_login');
            }
            req.logIn(user, function(err) {
                if (err) {
                    return next(err);
                } else {
                    return res.json({
                        href: req.session.loginToUrl || '/_admin/dashboard'
                    });
                }
            });
        })(req, res, next);
    }
};