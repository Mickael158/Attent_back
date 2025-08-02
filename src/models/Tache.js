const mongoose = require('mongoose');

const TacheSchema = new mongoose.Schema({
    user: {type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    prestation: {type: mongoose.Schema.Types.ObjectId, ref: 'Prestation', required: true },
    status: {type: String,enum: ['pending', 'in_progress', 'completed'],default: 'pending'} 
}, {timestamps: true    });

module.exports = mongoose.model('Tache', TacheSchema);