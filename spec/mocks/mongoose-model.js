var mongooseModel = {
    data: null,
    find: function() {
        return this;
    },
    exec: function(callback) {
        callback(null, this.data);
    }
};

module.exports = mongooseModel;