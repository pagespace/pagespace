GLOBAL.scenario = function(description, specDefinitions) {
    jasmine.getEnv().describe(description + ': ', specDefinitions);
};
GLOBAL.given = function(description, specDefinitions) {
    jasmine.getEnv().describe('Given ' + description + ', ', specDefinitions);
};
GLOBAL.when = function(description, specDefinitions) {
    jasmine.getEnv().describe('when ' + description, specDefinitions);
};
GLOBAL.and = function(description, specDefinitions) {
    jasmine.getEnv().describe('and ' + description, specDefinitions);
};
GLOBAL.then = function(description, specDefinitions) {
    jasmine.getEnv().it(', then ' + description + '.', specDefinitions);
};
GLOBAL.xgiven = function(description, specDefinitions) {
    jasmine.getEnv().xdescribe('Given ' + description + ', ', specDefinitions);
};
GLOBAL.xwhen = function(description, specDefinitions) {
    jasmine.getEnv().xdescribe('when ' + description, specDefinitions);
};
GLOBAL.xand = function(description, specDefinitions) {
    jasmine.getEnv().xdescribe('and ' + description, specDefinitions);
};
GLOBAL.xthen = function(description, specDefinitions) {
    jasmine.getEnv().xit(', then ' + description + '.', specDefinitions);
};