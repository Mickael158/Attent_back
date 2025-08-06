const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { SECRET_KEY } = require('../config/config');

const refreshTokenMiddleware = async (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Token manquant. Accès non autorisé.' });
    }

    try {
        const decoded = jwt.decode(token); // Décode le token pour obtenir l'ID

        const user = await User.findById(decoded.id); // Recherche l'utilisateur par ID

        if (!user) {
            return res.status(401).json({ message: 'Token invalide ou utilisateur non trouvé.' });
        }

        jwt.verify(token, SECRET_KEY, (err) => {
            if (err) {
                return res.status(401).json({ message: 'Token invalide. Accès interdit.' });
            }
            req.user = user;
            next();
        });
    } catch (error) {
        return res.status(500).json({ message: 'Erreur interne du serveur', error: error.message });
    }
};

module.exports = refreshTokenMiddleware;          