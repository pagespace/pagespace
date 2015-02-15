/**
 * Copyright © 2015, Philip Mander
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

//support
var fs = require('fs'),
    path = require('path'),

    Promise = require('bluebird'),

    consts = require('../app-constants'),
    psUtil = require('../misc/pagespace-util');

var reqTypes  = {
    TEMPLATES: 'templates'
};

var MiscHandler = function() {
};

module.exports = new MiscHandler();

MiscHandler.prototype.init = function(support) {

    this.logger = support.logger;
    this.reqCount = 0;

    var self = this;
    return function(req, res, next) {
        return self.doRequest(req, res, next);
    };
};

MiscHandler.prototype.doRequest = function(req, res, next) {

    //var logger = psUtil.getRequestLogger(this.logger, req, 'login', ++this.reqCount);

    var reqInfo = consts.requests.MISC.regex.exec(req.url);
    var reqType = reqInfo[1];

    if(reqType === reqTypes.TEMPLATES && req.method === 'GET') {
        return this.getTemplates(req, res, next);
    } else {
        var err = new Error('Unrecognized method');
        err.status = 405;
        next(err);
    }
};

MiscHandler.prototype.getTemplates = function(req, res, next) {

    var views = req.app.get('views');
    if(!views || (typeof views !== 'string' && !(views instanceof Array))) {
        var err = new Error('Cannot show available templates. No view dirs are defined');
        err.status = 501;
        next(err);
    }

    if(typeof views === 'string') {
        views = [ views ];
    }

    var walkPromises = views.map(function(viewDir) {
        return walkFiles(viewDir);
    });
    Promise.all(walkPromises).then(function(fileSets) {
        var files = [];
        files = Array.prototype.slice(fileSets).concat.apply(files, fileSets);
        return res.json(files);
    }).catch(function(e) {
        next(e);
    });
};

//walk the dir and gets
var readdirAsync = Promise.promisify(fs.readdir);
var statAsync = Promise.promisify(fs.stat);
function walkFiles (directory, baseDirectory) {
    baseDirectory = baseDirectory || directory;
    var results = [];
    return readdirAsync(directory).map(function(file) {
        file = path.join(directory, file);
        return statAsync(file).then(function(stat) {
            if (stat.isFile()) {
                return results.push(file.substr(baseDirectory.length));
            }
            return walkFiles(file, baseDirectory).then(function(filesInDir) {
                results = results.concat(filesInDir);
            });
        });
    }).then(function() {
        return results;
    });
}