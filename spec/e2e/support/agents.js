var app = require('../../../app.js');
var server = app.server;
var Promise = require('bluebird');
var request = require('supertest');

var adminAgent = null;
var editorAgent = null;
var guestAgent = null;

var agents = {

    kill: function() {
        return new Promise(function(resolve) {
            adminAgent = null;
            editorAgent = null;
            guestAgent = null;
            app.server.on('close', function() {
                setTimeout(function() {
                    //a little time for mongoose to disconnect too
                    resolve();
                }, 100);
            });
            app.server.close();
        });
    },

    getGuestAgent: function (app) {
        if (!app) {
            throw new Error('Give me an app');
        }

        return new Promise(function (resolve) {
            if (guestAgent) {
                resolve(guestAgent);
                return;
            }
            guestAgent = request.agent(server);
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

            editorAgent = request.agent(server);
            editorAgent.post('/_auth/login')
                .send({ username: 'editor', password: 'editor' })
                .end(function (err, res) {
                    if (res.ok) {
                        console.log('Editor agent created');
                        resolve(editorAgent)
                    } else {
                        console.log('Failed to create EDITOR agent');
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

            adminAgent = request.agent(server);
            adminAgent.post('/_auth/login')
                .send({ username: 'admin', password: 'pagespace' })
                .end(function (err, res) {
                    if (res.ok) {
                        console.log('Admin agent created');
                        resolve(adminAgent)
                    } else {
                        console.log('Failed to create ADMIN agent');
                        reject(err, res);
                    }
                });
        });
    }
};

module.exports = agents;