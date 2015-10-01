var request = require('supertest'),
    agents = require('./agents'),
    app = require('../../../app.js'),
    pagespace = app.pagespace,
    Promise = require('bluebird');

function getAgentForUser(user) {
    if(user === 'admin') {
        return agents.getAdminAgent(app);
    } else if(user === 'editor') {
        return agents.getEditorAgent(app);
    } else {
        return agents.getGuestAgent(app)
    }
}

var support = {

    end: function() {
        return new Promise(function(resolve, reject) {
            pagespace.ready(function() {
                agents.kill().then(function() {
                    resolve();
                }).catch(function(err) {
                    reject(err);
                });
            });
        })
    },

    doReqs: function(method, opts) {

        var users = Array.isArray(opts.user) ? opts.user : [ opts.user ];
        var results = users.map(function(user) {
            opts.user = user;
            return support.doReq(method, opts)
        });

        return Promise.all(results);
    },

    doReq: function(method, opts) {
        var user = opts.user;
        var url = opts.url;
        var expectedStatus = opts.status;
        var body = opts.body || null;
        var accept = opts.accept || 'application/json';
        var contentType = opts.contentType || null;
        var fields = opts.fields || [];
        var attach = opts.attach || null;

        return pagespace.ready().then(function() {
            return getAgentForUser(user);
        }).then(function(agent) {
            return new Promise(function(resolve, reject) {
                var request = agent[method](url)
                    .set('Accept', accept)
                    .send(body);
                if(contentType) {
                    request = request.expect('Content-Type', contentType)
                }
                if(attach) {
                    request = request.attach(attach.name, attach.value);
                }
                if(fields) {
                    fields.forEach(function(field) {
                        request = request.field(field.name, field.value);
                    });
                }
                request.expect(expectedStatus)
                    .end(function(err, res){
                        if(err) {
                            return reject(err);
                        }
                        return resolve(res);
                    });
            });
        });

    },

    doGet: function(opts) {
        return support.doReq('get', opts);
    },

    doPost: function(opts) {
        return support.doReq('post', opts);
    },

    doPut: function(opts) {
        return support.doReq('put', opts);
    },

    doDel: function(opts) {
        return support.doReq('del', opts);
    },

    doGets: function(opts) {
        return support.doReqs('get', opts);
    },

    doPosts: function(opts) {
        return support.doReqs('post', opts);
    },

    doPuts: function(opts) {
        return support.doReqs('put', opts);
    },

    doDels: function(opts) {
        return support.doReqs('del', opts);
    }
};

module.exports = support;