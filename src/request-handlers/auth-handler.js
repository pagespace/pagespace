/**
 * Copyright © 2015, Versatile Internet
 *
 * This file is part of Pagespace.
 *
 * Pagespace is free software: you can redistribute it and/or modify
 * it under the terms of the Lesser GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Pagespace is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * Lesser GNU General Public License for more details.

 * You should have received a copy of the Lesser GNU General Public License
 * along with Pagespace.  If not, see <http://www.gnu.org/licenses/>.
 */

'use strict';

//support
var passport = require('passport'),
    async = require('async'),
    consts = require('../app-constants'),
    psUtil = require('../support/pagespace-util');

var reqTypes  = {
    LOGIN: 'login',
    LOGOUT: 'logout'
};

var AuthHandler = function() {
};

module.exports = new AuthHandler();

AuthHandler.prototype.init = function(support) {

    this.logger = support.logger;
    this.reqCount = 0;

    var self = this;
    return function(req, res, next) {
        return self.doRequest(req, res, next);
    };
};

AuthHandler.prototype.doRequest = function(req, res, next) {

    var reqInfo = consts.requests.AUTH.regex.exec(req.url);
    var reqType = reqInfo[1];

    var logger = psUtil.getRequestLogger(this.logger, req, 'auth', ++this.reqCount);

    if(reqType === reqTypes.LOGIN && req.method === 'GET' || req.method === 'POST') {
        logger.info('New login request');
        return this.doLogin(req, res, next, logger);
    } else if (reqType === reqTypes.LOGOUT && req.method === 'GET' || req.method === 'POST') {
        logger.info('New logout request');
        return this.doLogout(req, res, next, logger);
    } else {
        var err = new Error('Unrecognized method');
        err.status = 405;
        next(err);
    }
};

/**
 * Login
 * @param req
 * @param res
 * @param next
 * @param logger
 * @returns {*}
 */
AuthHandler.prototype.doLogin = function(req, res, next, logger) {

    if(req.method === 'GET') {
        var doNext = function(err) {
            if(err) {
                return next(err);
            } else {
                var data = {
                    badCredentials: psUtil.typeify(req.query.badCredentials) || false
                };
                if(req.headers.accept && req.headers.accept.indexOf('application/json') === -1) {
                    return res.render('login.hbs', data, function(err, html) {
                        if(err) {
                            logger.error(err, 'Trying to render login');
                            next(err);
                        } else {
                            logger.info('Sending login page');
                            res.send(html);
                        }
                    });
                } else {
                    return res.json({
                        message: res.status === 403 ?
                            'You are not authorized to access this resource' :
                            'You must login to access this resource'
                    });

                }
            }
        };

        return passport.authenticate('remember-me', function(err, user) {
            if (err) {
                return next(err);
            }
            req.logIn(user, function(err) {
                if (err) {
                    logger.warn(err, 'Error authenticating user with remember me');
                    return next(err);
                } else {
                    logger.info('User authenticated with remember me: %s', user.username);
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
                res.status(401);
                return res.json({
                    badCredentials: true
                });
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
                    logger.info('User logged failed');
                    return next(err);
                } else {
                    logger.info('User logged in OK as %s', user.role);
                    if(results[0]) {
                        res.cookie('remember_me', results[0], {
                            path: '/',
                            httpOnly: true,
                            maxAge: 604800000
                        });
                    }
                    return res.json({
                        href: req.session.loginToUrl || '/_dashboard'
                    });
                }
            });
        })(req, res, next);
    }
};

/**
 * Logout
 * @param req
 * @param res
 * @param next
 * @param logger
 */
AuthHandler.prototype.doLogout = function(req, res, next, logger) {
    req.logout();
    res.clearCookie('remember_me');
    logger.info('Logout OK, redirecting to login page');
    return res.redirect('/_auth/login');
};