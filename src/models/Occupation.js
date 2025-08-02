const mongoose = require('mongoose');

const OccupationSchema = new mongoose.Schema({
    users: {type: [mongoose.Schema.Types.ObjectId],ref: 'User',required: true },
    status: {type: String,enum: ['active', 'inactive', 'pending'],default: 'active'} },
    {timestamps: true

    });

module.exports = mongoose.model('Occupation', OccupationSchema);