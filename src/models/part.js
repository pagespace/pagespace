var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var pageModuleSchema = Schema({
    type: {
    	type: String,
    	unique: true,
    	required: true
    },
    data: Schema.Types.Mixed
});

var PageModule = mongoose.model('Part', pageModuleSchema);

module.exports = PageModule;