const mongoose = require('mongoose');

const AppelSchema = new mongoose.Schema({
    user: {type: mongoose.Schema.Types.ObjectId,ref: 'User',required: true},
    liste: {type: mongoose.Schema.Types.ObjectId,ref: 'Liste',required: true},
    date: {type: Date,default: Date.now}
}, {timestamps: true});

module.exports = mongoose.model('Appel', AppelSchema);