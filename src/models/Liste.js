const mongoose = require('mongoose');

const ListeSchema = new mongoose.Schema({
    dateHeure: { type: Date, required: true }, 
    numero: { type: String, required: true, unique: true }, 
    id_prestation: { type: mongoose.Schema.Types.ObjectId, ref: 'Prestation', required: true } 
});

module.exports = mongoose.model('Liste', ListeSchema);