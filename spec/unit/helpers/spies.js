'use strict';

module.exports = function createSpies() {

    //util
    function traverse(obj, cb) {
        for (var i in obj) {
            cb.apply(this, [i, obj[i]]);
            if (obj[i] !== null && typeof(obj[i]) === 'object') {
                traverse(obj[i], cb);
            }
        }
    }

//that's all... no magic, no bloated framework


    //bunyan/logger ----------------------------------------------------------------------------------------------------
    const logger = jasmine.createSpyObj('logger', [ 'child' ]);
    logger.child.and.returnValue(jasmine.createSpyObj('loggerChild', [ 'trace', 'debug', 'info', 'warn', 'error']));


    //mongoose ---------------------------------------------------------------------------------------------------------
    const query = jasmine.createSpyObj('query', [ 'populate', 'sort', 'exec']);
    query.populate.and.returnValue(query);
    query.sort.and.returnValue(query);

    const Model = function(data) { this._setData(data) };
    Model.find = jasmine.createSpy('find');
    Model.findById = jasmine.createSpy('findById');
    Model.findOne = jasmine.createSpy('findOne');
    Model.findOneAndUpdate = jasmine.createSpy('findOneAndUpdate');
    Model.findOneAndRemove = jasmine.createSpy('findOneAndRemove');
    Model.findByIdAndUpdate = jasmine.createSpy('findByIdAndUpdate')
    Model.findByIdAndRemove = jasmine.createSpy('findByIdAndRemove');
    Model.update = jasmine.createSpy('update');
    Model.prototype.save = jasmine.createSpy('save');
    Model.prototype._setData = jasmine.createSpy('_setData');
    Model.find.and.returnValue(query);
    Model.findById.and.returnValue(query);
    Model.findOne.and.returnValue(query);
    Model.findOneAndUpdate.and.returnValue(query);
    Model.findByIdAndUpdate.and.returnValue(query);
    Model.findByIdAndRemove.and.returnValue(query);
    Model.findOneAndRemove.and.returnValue(query);

    //called with every property and it's value
    function mongooseify(obj, returnValues) {

        applyMethods(obj);

        traverse(obj, (key, value) => {
            applyMethods(value);
        });

        function applyMethods(value) {
            if(value && value.hasOwnProperty('_id')) {
                value.toObject = jasmine.createSpy('toObject');
                value.toObject.and.returnValue(JSON.parse(JSON.stringify(value)));
                value.save = jasmine.createSpy('save');
                value.save.and.returnValue(returnValues && returnValues.save ? returnValues.save : Promise.resolve({name : 'fooy'}));
            }
        }
    }

    //pagespace support ------------------------------------------------------------------------------------------------

    //db support
    const dbSupport = jasmine.createSpyObj('dbSupport', [ 'getModel']);
    dbSupport.getModel.and.returnValue(Model);

    //plugin resolver
    const pluginResolver = jasmine.createSpyObj('pluginResolver', [ 'require']);
    pluginResolver.require.and.callFake(pluginName => {
        return {
            name: pluginName,
            viewPartial: `<p>${pluginName}</p>`,
            __dir: '/plugins/' + pluginName
        };
    });

    //view engine
    const viewEngine = jasmine.createSpyObj('viewEngine', [ 'registerPartial']);

    //local resolver
    const localeResolver = jasmine.createSpy('localResolver');
    localeResolver.and.returnValue('en');


    //express stubs ----------------------------------------------------------------------------------------------------
    const http = require('http');
    const req = http.request({
        host: 'example.org',
    });
    req.app = jasmine.createSpyObj('app', [ 'get', 'set']);
    req.body = {
        __v: 'xyz'
    };
    req.headers = {
        accept: 'application/json'
    };
    req.query = {},
    req.session = {},
    req.user = {
        username: 'Mr User',
        name: 'mruser',
        _id: '56043cd318a5646b496baaaf',
        role: 'developer'
    };
    req.url = null;

    const res = jasmine.createSpyObj('response', [ 'json', 'send', 'status', 'render', 'header', 'redirect']);
    const next = jasmine.createSpy('next');

    //other modules ----------------------------------------------------------------------------------------------------

    //send
    const stream = jasmine.createSpyObj('stream', ['on', 'pipe']);
    const send = jasmine.createSpy('send');
    send.and.returnValue(stream);

    //formidable
    const formidable = {};
    formidable.IncomingForm = function () {};
    formidable.IncomingForm.prototype.parse = jasmine.createSpy('parse');

    //export -----------------------------------------------------------------------------------------------------------
    return {
        logger,
        dbSupport,
        pluginResolver,
        viewEngine,
        localeResolver,
        Model,
        query,
        req,
        res,
        next,
        send,
        stream,
        formidable,
        testUtil: {
            mongooseify
        }
    };
}


