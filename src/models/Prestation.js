const mongoose = require('mongoose');

const PrestationSchema = new mongoose.Schema({
    nom: { type: String, required: true },
    ref: { type: String, required: true, unique: true } // Ajout du champ ref
});

module.exports = mongoose.model('Prestation', PrestationSchema);