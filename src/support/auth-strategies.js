'use strict';

//deps
const 
    LocalStrategy = require('passport-local').Strategy,
    BasicStrategy = require('passport-http').BasicStrategy,
    RememberMeStrategy = require('passport-remember-me').Strategy;

const getDbAuth = (dbSupport) => {
    return (username, password, done) => {
        const User = dbSupport.getModel('User');
        User.findOne({username: username}, (err, user) => {
            if (err) {
                return done(err);
            }
            if (!user) {
                return done(null, false, {
                    message: 'Incorrect username.'
                });
            }
            user.comparePassword(password, (err, match) => {
                if (!match) {
                    done(null, false, {
                        message: 'Incorrect password.'
                    });
                } else {
                    done(null, user);
                }
            });
        });
    };
};

module.exports = {
    getBasicStrategy: function (dbSupport) {
        return new BasicStrategy(getDbAuth(dbSupport));
    },
    getLocalStrategy: function (dbSupport) {
        return new LocalStrategy(getDbAuth(dbSupport));
    },
    getRememberMeStrategy: function(dbSupport) {
        return new RememberMeStrategy((token, done) => {
            const User = dbSupport.getModel('User');
            User.findOne({ rememberToken: token }, (err, user) => {
                if(err) {
                    return done(err);
                }
                if(!user) {
                    return done(null, false);
                } else {
                    return done(null, user);
                }
            });
        }, (user, done) => {
            user.rememberToken = user.generateToken();
            user.save((err) => {
                if (err) {
                    return done(err);
                } else {
                    return done(null, user.rememberToken);
                }
            });
        });
    }
};