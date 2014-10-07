var mongoose = require('mongoose');
var bcrypt = require('bcrypt');
var SALT_WORK_FACTOR = 10;

var UserSchema = mongoose.Schema({
    username: {
        type: String, required: true,
        index: { unique: true }
    },
    password: {
        type: String
    },
    name: {
        type: String
    },
    email: {
        type: String
    },
    role: {
        type: String,
        default: "guest"
    },
    rememberToken: {
        type: String
    }
});

UserSchema.pre('save', function(next) {
    var user = this;

    // only hash the password if it has been modified (or is new)
    if (!user.isModified('password')) {
        return next();
    }

    // generate a salt
    bcrypt.genSalt(SALT_WORK_FACTOR, function(err, salt) {
        if (err) {
            return next(err);
        }

        // hash the password using our new salt
        bcrypt.hash(user.password, salt, function(err, hash) {
            if (err) {
                return next(err);
            }

            // override the cleartext password with the hashed one
            user.password = hash;
            next();
        });
    });
});

UserSchema.methods.comparePassword = function(candidatePassword, cb) {
    bcrypt.compare(candidatePassword, this.password, function(err, isMatch) {
        if (err) {
            return cb(err);
        }
        cb(null, isMatch);
    });
};

UserSchema.methods.generateToken = function() {
    return bcrypt.hashSync(this.username + Math.random().toString(), 1);
};

UserSchema.statics.createGuestUser = function() {
    return new User({
        username: "guest",
        name: "Guest"
    });
};

var User = mongoose.model('User', UserSchema);

module.exports = User;