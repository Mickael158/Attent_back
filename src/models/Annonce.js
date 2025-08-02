const mongoose = require('mongoose');

const AnnonceSchema = new mongoose.Schema({
    texte: {type: String, required: true },
}, {timestamps: true });

module.exports = mongoose.model('Annonce', AnnonceSchema);