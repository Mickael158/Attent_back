const User = require('../models/User');

const roleMiddleware = (roles) => {
    return async (req, res, next) => {
        const userId = req.user._id; 

        try {
            const user = await User.findById(userId).populate('idRoles');

            if (!user) {
                return res.status(404).json({ message: 'Utilisateur non trouvé.' });
            }

            if (!roles.includes(user.idRoles.nom)) {
                return res.status(403).json({ message: 'Accès interdit : rôle non autorisé.' });
            } 

            next(); 
        } catch (error) {
            return res.status(500).json({ message: 'Erreur interne du serveur', error: error.message });
        }
    };
};

module.exports = roleMiddleware;