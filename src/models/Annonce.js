const mongoose = require('mongoose');

const AnnonceSchema = new mongoose.Schema({
  texte: { type: String, required: true },
});

module.exports = mongoose.model('Annonce', AnnonceSchema);