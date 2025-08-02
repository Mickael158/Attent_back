const express = require('express');
const router = express.Router();
const Appel = require('../models/Appel'); // Modèle Appel
const Liste = require('../models/Liste'); // Modèle Liste
const Tache = require('../models/Tache'); // Modèle Tache
const Occupation = require('../models/Occupation'); // Modèle Occupation
const refreshTokenMiddleware = require('../middleware/refreshTokenMiddleware'); // Middleware pour rafraîchir le token
const roleMiddleware = require('../middleware/roleMiddleware'); // Middleware pour vérifier les rôles

// Route pour insérer dans Appel
router.post('/insert-appel', refreshTokenMiddleware, roleMiddleware(['admin', 'box' , 'affichage']), async (req, res) => {
        try {
            // Définir la date de début et de fin pour aujourd'hui
            const startOfDay = new Date();
            startOfDay.setHours(0, 0, 0, 0); // Début de la journée
            const endOfDay = new Date();
            endOfDay.setHours(23, 59, 59, 999); // Fin de la journée

            // Trouver le premier numéro qui n'est pas encore dans Appel pour aujourd'hui
            const existingAppels = await Appel.find({
                createdAt: { $gte: startOfDay, $lte: endOfDay }
            }).select('liste');

            const existingListeIds = existingAppels.map(appel => appel.liste);

            // Obtenir la première liste dont le numéro n'est pas dans les appels existants pour aujourd'hui
            const liste = await Liste.findOne({
                numero: { $nin: existingListeIds }
            }).sort({ dateHeure: 1 });

            if (!liste) {
                return res.status(404).json({ message: 'Aucune liste disponible pour aujourd\'hui.' });
            }

            // Récupérer les utilisateurs actifs
            const activeOccupations = await Occupation.find({ status: 'active' }).select('users');
            const activeUserIds = activeOccupations.flatMap(occupation => occupation.users);

            // Vérifier les tâches actives pour les utilisateurs actifs
            const activeTasks = await Tache.find({ user: { $in: activeUserIds }, status: 'active' });

            if (activeTasks.length === 0) {
                return res.status(400).json({ message: 'Aucun utilisateur actif avec des tâches actives.' });
            }

            // Créer une nouvelle entrée dans Appel
            const newAppel = new Appel({
                user: activeUserIds[0], // Prendre le premier utilisateur actif
                liste: liste._id // L'ID de la liste trouvée
            });

            const savedAppel = await newAppel.save(); // Sauvegarde dans la base de données
            res.status(201).json(savedAppel); // Renvoie la nouvelle entrée
        } catch (error) {
            res.status(500).json({ message: error.message }); // Gérer les erreurs
        }
    }
);

module.exports = router;