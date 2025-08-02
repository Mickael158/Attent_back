const express = require('express');
const Occupation = require('../models/Occupation'); // Modèle Occupation
const refreshTokenMiddleware = require('../middleware/refreshTokenMiddleware'); // Middleware pour le token
const roleMiddleware = require('../middleware/roleMiddleware'); // Middleware pour le contrôle des rôles
const router = express.Router();
const Role = require('../models/Role'); 
const User = require('../models/User'); 

// Route pour insérer une nouvelle occupation
router.post('/occupation', refreshTokenMiddleware, roleMiddleware(['admin']), async (req, res) => {
    try {
        // Récupérer le rôle 'box'
        const role = await Role.findOne({ nom: 'box' });
        if (!role) {
            return res.status(404).json({ message: 'Rôle "box" non trouvé.' });
        }
        
        // Récupérer tous les utilisateurs avec le rôle 'box'
        const usersWithRole = await User.find({ idRoles: role._id }).select('_id'); // Extraire les IDs des utilisateurs

        if (usersWithRole.length === 0) {
            return res.status(404).json({ message: 'Aucun utilisateur avec le rôle "box" trouvé.' });
        }

        // Récupérer l'occupation existante
        const existingOccupation = await Occupation.findOne({ users: { $in: usersWithRole.map(user => user._id) } });

        // Filtrer les utilisateurs déjà insérés dans l'occupation
        const newUsers = usersWithRole.filter(user => {
            return !existingOccupation || !existingOccupation.users.includes(user._id);
        }).map(user => user._id);

        if (newUsers.length === 0) {
            return res.status(400).json({ message: 'Tous les utilisateurs sont déjà insérés dans l\'occupation.' });
        }

        // Définir le statut par défaut à 'pending'
        const status = req.body.status || 'pending'; 

        const newOccupation = new Occupation({
            users: newUsers, // Passer les nouveaux utilisateurs
            status // Utiliser le statut défini
        });

        await newOccupation.save();
        res.status(201).json(newOccupation); // Renvoie la nouvelle occupation créée
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Route pour modifier une occupation existante par utilisateur
router.put('/occupation/user/:userId', refreshTokenMiddleware, roleMiddleware(['box']), async (req, res) => {
    const { status } = req.body; // Récupère le statut depuis le corps de la requête
    try {
        // Recherche l'occupation contenant l'utilisateur spécifié
        const updatedOccupation = await Occupation.findOneAndUpdate(
            { users: req.params.userId }, // Recherche par ID d'utilisateur
            { status }, // Met à jour seulement le statut
            { new: true, runValidators: true } // Renvoie le document mis à jour et applique les validateurs
        );

        if (!updatedOccupation) {
            return res.status(404).json({ message: 'Occupation non trouvée pour cet utilisateur.' });
        }

        res.json(updatedOccupation); // Renvoie l'occupation mise à jour
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;