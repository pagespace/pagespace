var mongooseMock = {
    connect: function() {
        return this.db;
    },
    connection: {
        on: function() {},
        once: function() {}
    }
};

module.exports = mongooseMock;