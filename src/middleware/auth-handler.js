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
const url = require('url'),
    passport = require('passport'),
    typeify = require('../support/typeify'),
    BaseHandler = require('./base-handler');

const reqTypes  = {
    LOGIN: 'login',
    LOGOUT: 'logout'
};

class AuthHandler extends BaseHandler {
    
    get pattern() {
        return new RegExp('^/_auth/(login|logout)');    
    }
    
    init(support) {
        this.logger = support.logger;
    }

    doGet(req, res, next) {
        const logger = this.getRequestLogger(this.logger, req);
    
        const urlPath = url.parse(req.url).pathname;
        const reqInfo = this.pattern.exec(urlPath);
        const reqType = reqInfo[1];
    
        if(reqType === reqTypes.LOGIN ) {
            logger.info('New login request');
            return this._loginRemember(req, res, next, logger);
        } else if (reqType === reqTypes.LOGOUT) {
            logger.info('New logout request');
            return this._logout(req, res, next, logger);
        } else {
            this.doUnrecognized(req, res, next);
        }
    }

    doPost(req, res, next) {
        const logger = this.getRequestLogger(this.logger, req);

        const reqInfo = this.pattern.exec(req.url);
        const reqType = reqInfo[1];

        if (reqType === reqTypes.LOGIN) {
            logger.info('New login request');
            return this._loginForm(req, res, next, logger);
        } else {
            this.doUnrecognized(req, res, next);
        }
    }

    _loginRemember(req, res, next, logger) {
        function doNext(err) {
            if(err) {
                return next(err);
            }

            const data = {
                badCredentials: typeify(req.query.badCredentials) || false
            };
            if(req.headers.accept && req.headers.accept.indexOf('application/json') === -1) {
                return res.render('login.hbs', data, (err, html) => {
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
    
        return passport.authenticate('remember-me', (err, user) => {
            if (err) {
                return next(err);
            }
            req.logIn(user, (err) => {
                if (err) {
                    logger.warn(err, 'Error authenticating user with remember me');
                    return next(err);
                } else {
                    logger.info('User authenticated with remember me: %s', user.username);
                    return res.redirect(req.session.loginToUrl);
                }
            });
        })(req, res, doNext);
    }
    
     _loginForm(req, res, next, logger) {
        return passport.authenticate('local', (err, user) => {
            if (err) {
                return next(err);
            }
            if (!user) {
                res.status(401);
                return res.json({
                    badCredentials: true
                });
            }
    
            return new Promise((resolve, reject) => {
                if (req.body.remember_me) {
                    user.rememberToken = user.generateToken();
                    user.save((err) => {
                        if (err) {
                            reject(err);
                        } else {
                            resolve(user.rememberToken);
                        }
                    });
                } else {
                    resolve();
                }
            }).then((rememberMeToken) => {
                return new Promise((resolve, reject) => {
                    req.logIn(user, (err) => {
                        if (err) {
                            reject(err);
                        } else {
                            resolve(rememberMeToken);
                        }
                    });
                });
            }).then((rememberMeToken) => {
                logger.info('User logged in OK as %s', user.role);
                if(rememberMeToken) {
                    res.cookie('remember_me', rememberMeToken, {
                        path: '/',
                        httpOnly: true,
                        maxAge: 604800000
                    });
                }
                return res.json({
                    href: req.session.loginToUrl || '/_dashboard'
                });
            });
        })(req, res, next);
    }
    
   
    _logout(req, res, next, logger) {
        req.logout();
        res.clearCookie('remember_me');
        logger.info('Logout OK, redirecting to login page');
        return res.redirect('/_auth/login');
    }
}

module.exports = new AuthHandler();


