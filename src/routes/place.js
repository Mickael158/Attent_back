const express = require('express');
const Place = require('../models/Place'); // Modèle Place
const User = require('../models/User'); // Modèle User
const Role = require('../models/Role'); // Modèle Role
const refreshTokenMiddleware = require('../middleware/refreshTokenMiddleware'); // Middleware pour le token
const roleMiddleware = require('../middleware/roleMiddleware'); // Middleware pour le contrôle des rôles
const router = express.Router();

// Route pour insérer des places pour tous les utilisateurs avec le rôle 'box'
router.post('/place', refreshTokenMiddleware, roleMiddleware(['admin']), async (req, res) => {
    try {
        // Récupérer l'ID du rôle 'box'
        const role = await Role.findOne({ nom: 'box' });
        if (!role) {
            return res.status(404).json({ message: 'Rôle "box" non trouvé.' });
        }

        // Récupérer tous les utilisateurs avec le rôle 'box'
        const users = await User.find({ idRoles: role._id }).select('_id');
        if (users.length === 0) {
            return res.status(404).json({ message: 'Aucun utilisateur avec le rôle box trouvé.' });
        }

        // Créer une liste de places à insérer
        const places = users.map(user => ({
            user: user._id,
            numero: `P-${user._id}`, // Exemple de génération de numéro
            ref_place: `Place for User ${user._id}` // Référence par défaut
        }));

        // Insérer toutes les places en une seule opération
        const createdPlaces = await Place.insertMany(places);

        res.status(201).json(createdPlaces); // Renvoie les places créées
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Route pour modifier 'ref_place' et 'numero' d'une place par utilisateur
router.put('/place/user/:userId', refreshTokenMiddleware, roleMiddleware(['admin', 'box']), async (req, res) => {
    const { userId } = req.params; // Récupère l'ID de l'utilisateur depuis les paramètres
    const { ref_place, numero } = req.body; // Récupère les nouvelles valeurs depuis le corps de la requête
    try {
        // Recherche la place associée à l'utilisateur
        const place = await Place.findOne({ user: userId });
        if (!place) {
            return res.status(404).json({ message: 'Place non trouvée pour cet utilisateur.' });
        }

        // Met à jour 'ref_place' et 'numero' de la place
        place.ref_place = ref_place;
        place.numero = numero;
        await place.save(); // Sauvegarde les modifications

        res.json(place); // Renvoie la place mise à jour
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;