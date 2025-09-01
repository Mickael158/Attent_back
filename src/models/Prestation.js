const mongoose = require('mongoose');

const PrestationSchema = new mongoose.Schema({
    nom: { type: String, required: true, unique: true },
    ref: { type: String, required: true } 
});

module.exports = mongoose.model('Prestation', PrestationSchema);