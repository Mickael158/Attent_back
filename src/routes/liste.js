const express = require('express');
const Prestation = require('../models/Prestation'); // Modèle Prestation
const Liste = require('../models/Liste'); // Modèle Liste
const refreshTokenMiddleware = require('../middleware/refreshTokenMiddleware'); // Middleware pour le token
const roleMiddleware = require('../middleware/roleMiddleware'); // Middleware pour le contrôle des rôles
const router = express.Router();

// Route pour créer une nouvelle entrée dans Liste
router.post('/liste', refreshTokenMiddleware, roleMiddleware(['port']), async (req, res) => {
    const { ref } = req.body; // Récupère la référence de la prestation depuis le corps de la requête
    try {
        // Rechercher la prestation par sa référence
        const prestation = await Prestation.findOne({ ref });

        if (!prestation) {
            return res.status(404).json({ message: 'Prestation non trouvée.' });
        }

        // Obtenez la date actuelle sans l'heure
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Réinitialise l'heure pour comparer uniquement la date

        // Recherchez les entrées du jour pour cette prestation
        const todayListes = await Liste.find({
            id_prestation: prestation._id, // Utilise l'ID de la prestation trouvée
            dateHeure: { $gte: today } // Filtrer pour la date actuelle
        });

        // Génération du numéro
        const nextNum = todayListes.length > 0 ? todayListes.length + 1 : 1; // Incrémente le numéro

        // Créez le numéro de la forme "ref-numero"
        const numero = `${prestation.ref}-${nextNum}`;

        const newListe = new Liste({
            dateHeure: new Date(),
            numero: numero,
            id_prestation: prestation._id // Utilise l'ID de la prestation trouvée
        });

        await newListe.save();
        res.status(201).json(newListe);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;