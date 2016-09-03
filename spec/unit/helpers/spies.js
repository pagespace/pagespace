'use strict';

module.exports = function createSpies() {

    //bunyan/logger ----------------------------------------------------------------------------------------------------
    const logger = jasmine.createSpyObj('logger', [ 'child' ]);
    logger.child.and.returnValue(jasmine.createSpyObj('loggerChild', [ 'debug', 'info', 'warn', 'error']));


    //mongoose ---------------------------------------------------------------------------------------------------------
    const query = jasmine.createSpyObj('query', [ 'populate', 'sort', 'exec']);
    query.populate.and.returnValue(query);
    query.sort.and.returnValue(query);

    const Model = function(data) { this._setData(data) };
    Model.find = jasmine.createSpy('find');
    Model.findOne = jasmine.createSpy('findOne');
    Model.findOneAndUpdate = jasmine.createSpy('findOneAndUpdate');
    Model.findOneAndRemove = jasmine.createSpy('findOneAndRemove');
    Model.findByIdAndRemove = jasmine.createSpy('findByIdAndRemove');
    Model.prototype.save = jasmine.createSpy('save');
    Model.prototype._setData = jasmine.createSpy('_setData');
    Model.find.and.returnValue(query);
    Model.findOne.and.returnValue(query);
    Model.findOneAndUpdate.and.returnValue(query);
    Model.findByIdAndRemove.and.returnValue(query);
    Model.findOneAndRemove.and.returnValue(query);

    //pagespace support ------------------------------------------------------------------------------------------------

    //db support
    const dbSupport = jasmine.createSpyObj('dbSupport', [ 'getModel']);
    dbSupport.getModel.and.returnValue(Model);

    //plugin resolver
    const pluginResolver = jasmine.createSpyObj('pluginResolver', [ 'require']);
    pluginResolver.require.and.callFake(pluginName => {
        return {
            name: pluginName,
            viewPartial: `<p>${pluginName}</p>`
        };
    });

    //view engine
    const viewEngine = jasmine.createSpyObj('viewEngine', [ 'registerPartial']);

    //local resolver
    const localeResolver = jasmine.createSpy('localResolver');
    localeResolver.and.returnValue('en');


    //express stubs ----------------------------------------------------------------------------------------------------
    const req = {
        body: {
            __v: 'xyz'
        },
        headers: {
            accept: 'application/json'
        },
        query: {},
        session: {},
        user: {
            username: 'Mr User',
            name: 'mruser',
            _id: 'userid',
            role: 'developer'
        },
        url: null,
    };

    const res = jasmine.createSpyObj('response', [ 'json', 'send', 'status', 'render', 'header', 'redirect']);
    const next = jasmine.createSpy('next');

    //other modules ----------------------------------------------------------------------------------------------------

    //send
    const stream = jasmine.createSpyObj('stream', ['on', 'pipe']);
    const send = jasmine.createSpy('send');
    send.and.returnValue(stream);

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
        stream
    };
}


