const mongoose = require('mongoose');

const PlaceSchema = new mongoose.Schema({
    user: {type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    numero: {type: String, unique: true },
    ref_place: {type: String, required: true }
}, {timestamps: true });

module.exports = mongoose.model('Place', PlaceSchema);