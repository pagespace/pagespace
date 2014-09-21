var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var templateSchema = Schema({
    name: {
        type: String,
        required: true
    },
    src: {
    	type: String,
    	unique: true,
    	required: true
    },
    regions: [ String ]
});

var Template = mongoose.model('Template', templateSchema);

module.exports = Template;