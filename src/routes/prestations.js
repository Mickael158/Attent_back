const express = require('express');
const Prestation = require('../models/Prestation'); // Modèle Prestation
const refreshTokenMiddleware = require('../middleware/refreshTokenMiddleware'); // Chemin vers vos middlewares
const roleMiddleware = require('../middleware/roleMiddleware');
const router = express.Router();

// Créer une nouvelle prestation (accessible uniquement aux administrateurs)
router.post('/', refreshTokenMiddleware, roleMiddleware(['admin']), async (req, res) => {
    const { nom, ref } = req.body;
    try {
        const newPrestation = new Prestation({ nom, ref });
        await newPrestation.save();
        res.status(201).json(newPrestation);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Récupérer toutes les prestations (accessible à tous les utilisateurs authentifiés)
router.get('/', refreshTokenMiddleware, roleMiddleware(['admin']), async (req, res) => {
    try {
        const prestations = await Prestation.find();
        res.status(200).json(prestations);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Récupérer une prestation par ID (accessible à tous les utilisateurs authentifiés)
router.get('/:id', refreshTokenMiddleware, roleMiddleware(['admin']), async (req, res) => {
    try {
        const prestation = await Prestation.findById(req.params.id);
        if (!prestation) {
            return res.status(404).json({ message: 'Prestation non trouvée.' });
        }
        res.status(200).json(prestation);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Mettre à jour une prestation (accessible uniquement aux administrateurs)
router.put('/:id', refreshTokenMiddleware, roleMiddleware(['admin']), async (req, res) => {
    const { nom, ref } = req.body;
    try {
        const updatedPrestation = await Prestation.findByIdAndUpdate(
            req.params.id,
            { nom, ref },
            { new: true, runValidators: true }
        );
        if (!updatedPrestation) {
            return res.status(404).json({ message: 'Prestation non trouvée.' });
        }
        res.status(200).json(updatedPrestation);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Supprimer une prestation (accessible uniquement aux administrateurs)
router.delete('/:id', refreshTokenMiddleware, roleMiddleware(['admin']), async (req, res) => {
    try {
        const prestation = await Prestation.findByIdAndDelete(req.params.id);
        if (!prestation) {
            return res.status(404).json({ message: 'Prestation non trouvée.' });
        }
        res.status(200).json({ message: 'Prestation supprimée avec succès.' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;