'use strict';

//bunyan
const logger = jasmine.createSpyObj('logger', [ 'child' ]);
logger.child.and.returnValue(jasmine.createSpyObj('loggerChild', [ 'debug', 'info', 'warn', 'error']));

const dbSupport = jasmine.createSpyObj('dbSupport', [ 'getModel']);

//mongoose
const query = jasmine.createSpyObj('query', [ 'populate', 'sort', 'exec']);
query.populate.and.returnValue(query);
query.sort.and.returnValue(query);

const Model = function(data) { this._setData(data) };
Model.find = jasmine.createSpy('find');
Model.findOneAndUpdate = jasmine.createSpy('findOneAndUpdate');
Model.findByIdAndRemove = jasmine.createSpy('findByIdAndRemove');
Model.prototype.save = jasmine.createSpy('save');
Model.prototype._setData = jasmine.createSpy('_setData');
Model.find.and.returnValue(query);
Model.findOneAndUpdate.and.returnValue(query);
Model.findByIdAndRemove.and.returnValue(query);

dbSupport.getModel.and.returnValue(Model);

//stub express objects
const req = {
    url: null,
    body: {
        __v: 'xyz'
    },
    query: {},
    headers: {
        accept: 'application/json'
    },
    user: {
        _id: 'userid'
    }
};

const res = jasmine.createSpyObj('response', [ 'json', 'send', 'status']);
const next = jasmine.createSpy('next');

module.exports = {
    logger,
    dbSupport,
    Model,
    query,
    req,
    res,
    next
};