const express = require('express');
const Tache = require('../models/Tache'); // Modèle Tache
const User = require('../models/User'); // Modèle User
const Prestation = require('../models/Prestation'); // Modèle Prestation
const Role = require('../models/Role'); // Modèle Role
const refreshTokenMiddleware = require('../middleware/refreshTokenMiddleware'); // Middleware pour le token
const roleMiddleware = require('../middleware/roleMiddleware'); // Middleware pour le contrôle des rôles
const router = express.Router();

// Route pour insérer des tâches pour tous les utilisateurs avec le rôle 'box' et toutes les prestations
router.post('/tache', refreshTokenMiddleware, roleMiddleware(['admin']), async (req, res) => {
    try {
        // Récupérer l'ID du rôle 'box'
        const role = await Role.findOne({ nom: 'box' }); // Assurez-vous que le champ 'name' est correct
        if (!role) {
            return res.status(404).json({ message: 'Rôle "box" non trouvé.' });
        }

        // Récupérer tous les utilisateurs avec le rôle 'box'
        const users = await User.find({ idRoles: role._id }).select('_id'); // On récupère uniquement les IDs
        if (users.length === 0) {
            return res.status(404).json({ message: 'Aucun utilisateur avec le rôle box trouvé.' });
        }

        // Récupérer toutes les prestations
        const prestations = await Prestation.find().select('_id'); // On récupère uniquement les IDs

        // Créer une liste de tâches à insérer
        const taches = users.map(user => 
            prestations.map(prestation => ({
                user: user._id,
                prestation: prestation._id,
                status: 'pending' // Valeur par défaut
            }))
        ).flat(); // Aplatir le tableau de tâches

        // Insérer toutes les tâches en une seule opération
        const createdTaches = await Tache.insertMany(taches);

        res.status(201).json(createdTaches); // Renvoie les tâches créées
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Route pour modifier le statut d'une tâche existante
router.put('/tache/:id/status', refreshTokenMiddleware, roleMiddleware(['admin', 'box']), async (req, res) => {
    const { status } = req.body; // Récupère le nouveau statut depuis le corps de la requête
    try {
        // Recherche la tâche par ID et met à jour le statut
        const updatedTache = await Tache.findByIdAndUpdate(
            req.params.id, // ID de la tâche à modifier
            { status }, // Met à jour seulement le statut
            { new: true, runValidators: true } // Renvoie le document mis à jour et applique les validateurs
        );

        if (!updatedTache) {
            return res.status(404).json({ message: 'Tâche non trouvée.' });
        }

        res.json(updatedTache); // Renvoie la tâche mise à jour
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;