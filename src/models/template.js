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
    regions: [ String ],
    regionData: [ Schema.Types.Mixed ]
});

var Template = mongoose.model('Template', templateSchema);

module.exports = Template;