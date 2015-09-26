var app = require('../../../app.js').app;
var Promise = require('bluebird');
var request = require('supertest');

var adminAgent = null;
var editorAgent = null;
var guestAgent = null;

var agents = {
    getGuestAgent: function (app) {
        if (!app) {
            throw new Error('Give me an app');
        }

        return new Promise(function (resolve) {
            if (guestAgent) {
                resolve(guestAgent);
                return;
            }
            guestAgent = request.agent(app);
            console.log('Guest agent created');
            resolve(guestAgent);
        });
    },

    getEditorAgent: function (app) {
        if (!app) {
            throw new Error('Give me an app');
        }

        return new Promise(function (resolve, reject) {
            if (editorAgent) {
                resolve(editorAgent);
                return;
            }

            editorAgent = request.agent(app);
            editorAgent.post('/_auth/login')
                .send({ username: 'editor', password: 'editor' })
                .end(function (err, res) {
                    if (res.ok) {
                        console.log('Editor agent created');
                        resolve(editorAgent)
                    } else {
                        reject(err, res);
                    }
                });
        });
    },

    getAdminAgent: function (app) {
        if (!app) {
            throw new Error('Give me an app');
        }

        return new Promise(function (resolve, reject) {
            if (adminAgent) {
                resolve(adminAgent);
                return;
            }

            adminAgent = request.agent(app);
            adminAgent.post('/_auth/login')
                .send({ username: 'admin', password: 'admin' })
                .end(function (err, res) {
                    if (res.ok) {
                        console.log('Admin agent created');
                        resolve(adminAgent)
                    } else {
                        reject(err, res);
                    }
                });
        });
    }
};

module.exports = agents;