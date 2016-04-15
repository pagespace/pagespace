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

const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const bcrypt = require('bcrypt');
const SALT_WORK_FACTOR = 10;

function generateSchema() {
    const userSchema = Schema({
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

    userSchema.set('toJSON', {
        transform: (doc, user) => {
            delete user.rememberToken;
            delete user.updatePassword;
            delete user.password;
            return user;
        }
    });

    userSchema.pre('save', function (next) {
        const user = this;

        user.updatedAt = Date.now();

        //TODO: is this required for update?
        // only hash the password if it has been modified (or is new)
        if (!user.isModified('password')) {
            return next();
        }

        // generate a salt
        bcrypt.genSalt(SALT_WORK_FACTOR, (err, salt) => {
            if (err) {
                return next(err);
            }

            // hash the password using our new salt
            bcrypt.hash(user.password, salt, (err, hash) => {
                if (err) {
                    return next(err);
                }

                // override the cleartext password with the hashed one
                user.password = hash;
                next();
            });
        });
    });

    userSchema.pre('findOneAndUpdate', function (next) {

        const query = this;

        query.getUpdate().updatedAt = Date.now();

        const plainPassword = query.getUpdate().password;
        if(plainPassword) {
            bcrypt.genSalt(SALT_WORK_FACTOR, (err, salt) => {
                if (err) {
                    return next(err);
                }
                bcrypt.hash(plainPassword, salt, (err, hash) => {
                    if (err) {
                        return next(err);
                    }
                    query.getUpdate().password = hash;
                    next();
                });
            });
        } else {
            next();
        }
    });

    userSchema.methods.comparePassword = function (candidatePassword, cb) {
        const self = this;
        bcrypt.compare(candidatePassword, this.password, (err, isMatch) => {
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

    userSchema.statics.serialize = function (user) {
        return {
            username: user.username,
            role: user.role,
            name: user.name,
            _id: user._id.toString()
        };
    };

    return userSchema;
}

module.exports = generateSchema;