'use strict';

//deps
const 
    fs = require('fs'),
    handlebars = require('handlebars'),
    handlebarsIntl = require('handlebars-intl');

//TODO: add debug logging
class ViewEngine {
    
    constructor() {
        this.handlebarsOpts = {};
        this.handlebarsInstances = {};
        this.commonLocals = {};        
    }

    setOpts(handlebarsOpts) {
        this.handlebarsOpts = handlebarsOpts || {};
    }

    setCommonLocals(commonLocals) {
        this.commonLocals = commonLocals;
    }

    getHandlebarsInstance(instanceId) {
        instanceId = instanceId || 'default';
        if(!this.handlebarsInstances[instanceId]) {
            this.handlebarsInstances[instanceId] = handlebars.create();
            this.handlebarsInstances[instanceId].templateCache = {};
            this.handlebarsInstances[instanceId].regsiteredPartials = {};
    
            //add formatting helpers
            handlebarsIntl.registerWith(this.handlebarsInstances[instanceId]);
        }
        return this.handlebarsInstances[instanceId];
    }

    __express(filename, locals, done) {
    
        locals = locals || {};
    
        for(let commonLocal in instance.commonLocals) {
            if(locals.hasOwnProperty(commonLocal)) {
                locals[commonLocal] = instance.commonLocals[commonLocal];
            }
        }
    
        const handleBarsInstance = instance.getHandlebarsInstance(locals.__template);
    
        const intlData = {
            locales: locals.__locale
        };
    
        // cached?
        const template = handleBarsInstance.templateCache[filename];
        if (template && locals.cache) {
            return done(null, template(locals, {
                data: { intl: intlData }
            }));
        }
    
        fs.readFile(filename, 'utf8', (err, file) => {
    
            if (err) {
                return done(err);
            }
    
            const template = handleBarsInstance.compile(file, instance.handlebarsOpts);
            handleBarsInstance.templateCache[filename] = template;
    
            try {
                const res = template(locals, {
                    data: { intl: intlData }
                });
                done(null, res);
            } catch (err) {
                err.message = filename + ': ' + err.message;
                done(err);
            }
        });
    }

    registerHelper(name, helper, template) {
        this.getHandlebarsInstance(template).registerHelper(name, helper);
    }

    registerPartial(name, partial, template) {
        const handlebarsInstance = this.getHandlebarsInstance(template);
        handlebarsInstance.regsiteredPartials[name] = handlebarsInstance.regsiteredPartials[name] || null;
        if(handlebarsInstance.regsiteredPartials[name] !== partial) {
            //only recompiles if partial value has changed
            handlebarsInstance.registerPartial(name, partial);
            handlebarsInstance.regsiteredPartials[name] = partial;
        }
    }

    unregisterHelper(name, template) {
        this.getHandlebarsInstance(template).unregisterHelper(name);
    }

    unregisterPartial(name, template) {
        this.getHandlebarsInstance(template).unregisterPartial(name);
    }
}

var instance = new ViewEngine();

module.exports = () => {
    return instance;
};