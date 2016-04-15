'use strict';

const express = require('express'),
    passport = require('passport'),
    createAcl = require('./setup/acl-setup'),
    authStrategies = require('./support/auth-strategies');

//middleware
const middlewareMap = new Map([
    [ 'api', require('./middleware/api-handler') ],
    [ 'auth', require('./middleware/auth-handler') ],
    [ 'dashboard', require('./middleware/dashboard-handler') ],
    [ 'media', require('./middleware/media-handler') ],
    [ 'publishing', require('./middleware/publishing-handler') ],
    [ 'static', require('./middleware/static-handler') ],
    [ 'templates', require('./middleware/templates-handler') ],
    [ 'pages', require('./middleware/page-handler') ]
]);

module.exports = function(support) {

    //passport setup
    passport.serializeUser((user, done) => {
        done(null, support.dbSupport.getModel('User').serialize(user));
    });
    passport.deserializeUser((userProps, done) => {
        const User = support.dbSupport.getModel('User');
        const user = new User(userProps);
        done(null, user);
    });
    passport.use(authStrategies.getBasicStrategy(support.dbSupport));
    passport.use(authStrategies.getLocalStrategy(support.dbSupport));
    passport.use(authStrategies.getRememberMeStrategy(support.dbSupport));

    const router = express.Router();

    //passport init
    router.use(passport.initialize());
    router.use(passport.session());

    //basic auth for api request without a session
    router.use(middlewareMap.get('api').pattern, (req, res, next) => {
        if(!req.user) {
            passport.authenticate('basic', { session: false })(req, res, next);
        } else {
            next();
        }
    });

    //acl
    const acl = createAcl(middlewareMap);
    router.use(acl.middleware());
    router.use(function(err, req, res, next) {
        if(err.status === 403) {
            const user = req.user || acl.GUEST_USER;
            const msg =
                `User with role [${user.role}] is not allowed to access ${req.url} (${req.method}). 
                 Redirecting to login.`;
            support.logger.info(msg);
            res.status(err.status);

            //force login request type
            req.originalUrl = req.url;
            if(req.session) {
                req.session.loginToUrl = req.originalUrl;
                req.method = 'GET';
                req.url = '/_auth/login';
                return next();
            } else {
                err = new Error('Not found');
                err.url = req.url;
                err.status = 404;
                return next(err);
            }
        }
        return next(err);
    });

    //set up routing for each middleware
    for(let middleware of middlewareMap.values()) {
        middleware.init(support);
        router.route(middleware.pattern)
            .get(middleware.doGet.bind(middleware))
            .post(middleware.doPost.bind(middleware))
            .put(middleware.doPut.bind(middleware))
            .delete(middleware.doDelete.bind(middleware));
    }

    return router;
};

