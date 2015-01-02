'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var bcrypt = require('bcrypt');
var SALT_WORK_FACTOR = 10;

function generateSchema() {
    var userSchema = Schema({
        username: {
            type: String, required: true,
            index: { unique: true }
        },
        password: {
            type: String,
            required: true
        },
        name: {
            type: String,
            required: true
        },
        email: {
            type: String
        },
        role: {
            type: String,
            default: 'guest',
            required: true
        },
        rememberToken: {
            type: String
        },
        updatePassword: {
            type: Boolean,
            default: false
        },
        createdAt: {
            type: Date,
            default: Date.now()
        },
        updatedAt: {
            type: Date
        },
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: 'User'
        },
        updatedBy: {
            type: Schema.Types.ObjectId,
            ref: 'User'
        }
    });

    userSchema.pre('save', function (next) {
        var user = this;

        user.updatedAt = Date.now();

        // only hash the password if it has been modified (or is new)
        if (!user.isModified('password')) {
            return next();
        }

        // generate a salt
        bcrypt.genSalt(SALT_WORK_FACTOR, function (err, salt) {
            if (err) {
                return next(err);
            }

            // hash the password using our new salt
            bcrypt.hash(user.password, salt, function (err, hash) {
                if (err) {
                    return next(err);
                }

                // override the cleartext password with the hashed one
                user.password = hash;
                next();
            });
        });
    });

    userSchema.methods.comparePassword = function (candidatePassword, cb) {
        var self = this;
        bcrypt.compare(candidatePassword, this.password, function (err, isMatch) {
            if (err) {
                return cb(err);
            }
            if(!isMatch) {
                isMatch = candidatePassword === self.password;
            }
            cb(null, isMatch);
        });
    };

    userSchema.methods.generateToken = function () {
        return bcrypt.hashSync(this.username + Math.random().toString(), 1);
    };

    return userSchema;
}

module.exports = generateSchema;