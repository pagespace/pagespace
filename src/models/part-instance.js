var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var partInstanceSchema = Schema({
    data: Schema.Types.Mixed,
    part: {
        type: Schema.Types.ObjectId,
        ref: 'Part'
    }
});

var PartInstanceModel = mongoose.model('PartInstance', partInstanceSchema);

module.exports = PartInstanceModel;