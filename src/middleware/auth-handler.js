'use strict';

//support
const url = require('url'),
    crypto = require('crypto'),
    Promise = require('bluebird'),
    passport = require('passport'),
    nodemailer = require('nodemailer'),
    htmlToText = require('nodemailer-html-to-text').htmlToText,
    typeify = require('../support/typeify'),
    BaseHandler = require('./base-handler');

const randomBytesAsync = Promise.promisify(crypto.randomBytes);

const ONE_HOUR = 1000 * 60 * 60;

const RESET_PASSWORD_EMAIL_TEMPLATE =
    `<h2>Pagespace password reset</h2>
    <p>You are receiving this mail because a forgotten password request was made at {{host}}</p>
    <p>To proceed and reset your password, click the following link:</p>
    <ul>
    <li><a href="https://{{host}}/_auth/login#reset-password?token={{token}}">Reset password &raquo;</a>
    </ul>
    <p>If you did not forget your password you can ignore this email.</p>`;

const reqTypes  = {
    LOGIN: 'login',
    LOGOUT: 'logout',
    FORGOT: 'forgot-password',
    RESET: 'reset-password'
};

class AuthHandler extends BaseHandler {

    get pattern() {
        return new RegExp(`^/_auth/(${reqTypes.LOGIN}|${reqTypes.LOGOUT}|${reqTypes.FORGOT}|${reqTypes.RESET})`);
    }

    init(support) {
        this.logger = support.logger;
        this.dbSupport = support.dbSupport;
        this.emailConfig = support.emailConfig;
    }

    doGet(req, res, next) {
        const logger = this.getRequestLogger(this.logger, req);

        const urlPath = url.parse(req.url).pathname;
        const reqInfo = this.pattern.exec(urlPath);
        const reqType = reqInfo[1];

        if(reqType === reqTypes.LOGIN ) {
            return this._loginRemember(req, res, next, logger);
        } else if (reqType === reqTypes.LOGOUT) {
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
        } else if (reqType === reqTypes.FORGOT) {
            logger.info('New forgotten password request');
            return this._forgotPassword(req, res, next, logger);
        } else if (reqType === reqTypes.RESET) {
            logger.info('New reset password request');
            return this._resetPassword(req, res, next, logger);
        } else {
            this.doUnrecognized(req, res, next);
        }
    }

    _loginRemember(req, res, next, logger) {
        const doNext = (err) => {
            if(err) {
                return next(err);
            }

            const data = {
                emailEnabled: !!this.emailConfig,
                badCredentials: typeify(req.query.badCredentials) || false
            };
            if(req.headers.accept && req.headers.accept.indexOf('application/json') === -1) {
                return res.render('auth.hbs', data, (err, html) => {
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
        };

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

    _forgotPassword(req, res, next, logger) {
        const User = this.dbSupport.getModel('User');
        const username = req.body.username;
        return Promise.all([ User.findOne({ username: username }), randomBytesAsync(32) ]).spread((user, tokenBuf) => {
            //save user with token
            if(user) {
                user.token = tokenBuf.toString('hex');
                user.tokenExpiry = Date.now() + (this.emailConfig ? ONE_HOUR : ONE_HOUR * 6);
                return user.save();
            }
            return Promise.resolve();
        }).then((user) => {
            if (user && this.emailConfig) {
                //send email
                const host = req.headers.host;
                const transporter = nodemailer.createTransport(this.emailConfig);
                transporter.use('compile', htmlToText());

                var send = transporter.templateSender({
                    subject: `Pagespace forgotten password request`,
                    html: RESET_PASSWORD_EMAIL_TEMPLATE
                });

                send({
                    from: `"Pagespace" <do-not-reply@${host}>`,
                    to: user.email
                }, {
                    host: host,
                    token: user.token
                }).then(err => {
                    logger.warn('Could not send forgotten password email');
                    logger.error(err);
                });
            }
            return Promise.resolve();
        }).then(() =>{
            res.statusCode = 204;
            return res.send();
        }).then(null, (err) =>{
            logger.error(err);
            next(err);
        });
    }

    _resetPassword(req, res, next, logger) {
        const token = req.body.token;
        let username = req.body.username;
        let password = req.body.password;

        if(!username || !token || !password) {
            const err = new Error('Invalid request');
            err.status = 400;
            return next(err);
        }

        username = username.trim();
        password = password.trim();

        const User = this.dbSupport.getModel('User');
        User.findOne({ username: username, token: token, tokenExpiry: { $gt: Date.now() }}).then((user) => {
            if(user) {
                user.token = null;
                user.password = password;
                return user.save();
            }
            const err = new Error('Unable to update password');
            err.status = 400;
            throw err;
        }).then(() => {
            res.statusCode = 204;
            return res.send();
        }).then(null, (err) => {
            logger.error(err);
            return next(err);
        });
    }
}

module.exports = new AuthHandler();