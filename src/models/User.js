const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    mail: { type: String, required: true, unique: true },
    pwsd: { type: String, required: true },
    idRoles: { type: mongoose.Schema.Types.ObjectId, ref: 'Role' },
    refreshToken: { type: String },
    isValidated: { type: Boolean, default: function() { return this.idRoles.nom !== 'box'; } }
});

module.exports = mongoose.model('User', UserSchema);