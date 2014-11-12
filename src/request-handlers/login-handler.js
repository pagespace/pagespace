"use strict";

//support
var bunyan = require('bunyan');
var passport = require('passport');
var async = require('async');
var util = require('../misc/util');

//util
var logger =  bunyan.createLogger({ name: 'login-handler' });
logger.level(GLOBAL.logLevel);

var LoginHandler = function() {
};

module.exports = function() {
    return new LoginHandler();
};

LoginHandler.prototype.doRequest = function(req, res, next) {

    logger.info('Processing login request for ' + req.url);

    if(req.method === 'GET') {
        var doNext = function(err) {
            if(err) {
                return next(err);
            } else {
                var data = {
                    badCredentials: util.typeify(req.query.badCredentials) || false
                };
                return res.render('login', data, function(err, html) {
                    if(err) {
                        logger.error(err, 'Trying to render login');
                        next(err);
                    } else {
                        logger.info('Sending page for %s', req.url);
                        res.send(html);
                    }
                });
            }
        };

        return passport.authenticate('remember-me', function(err, user) {
            if (err) {
                return next(err);
            }
            req.logIn(user, function(err) {
                if (err) {
                    return next(err);
                } else {
                    return res.redirect(req.session.loginToUrl);
                }
            });
        })(req, res, doNext);
    } else if(req.method === 'POST') {
        return passport.authenticate('local', function(err, user) {
            if (err) {
                return next(err);
            }
            if (!user) {
                return res.redirect('/_login?badCredentials=true');
            }
            async.series([
                function(callback) {
                    if (req.body.remember_me) {
                        user.rememberToken = user.generateToken();
                        user.save(function(err) {
                            if (err) {
                                callback(err);
                            } else {
                                callback(null, user.rememberToken);
                            }
                        });
                    } else {
                        callback();
                    }
                },
                function(callback) {
                    req.logIn(user, function(err) {
                        if (err) {
                            callback(err);
                        } else {
                            callback();
                        }
                    });
                }
            ], function(err, results) {
                if(err) {
                    return next(err);
                } else {
                    if(results[0]) {
                        res.cookie('remember_me', results[0], {
                            path: '/',
                            httpOnly: true,
                            maxAge: 604800000
                        });
                    }
                    return res.json({
                        href: req.session.loginToUrl || '/_admin/dashboard'
                    });
                }
            });
        })(req, res, next);
    }
};