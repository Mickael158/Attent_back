const express = require('express');
const mongoose = require('mongoose');
const Tache = require('../models/Tache');
const refreshTokenMiddleware = require('../middleware/refreshTokenMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const router = express.Router();

// Récupérer les tâches de l'utilisateur connecté
router.get('/user', refreshTokenMiddleware, roleMiddleware(['box']), async (req, res) => {
  try {
    const userId = req.user._id;
    const taches = await Tache.find({ user: userId }).populate('prestation', 'nom');
    res.json(taches);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur lors de la récupération des tâches' });
  }
});

// Mettre à jour le statut d'une tâche
router.put('/:id', refreshTokenMiddleware, roleMiddleware(['box']), async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: 'ID de tâche invalide' });
    }
    if (!['active', 'inactive', 'pending'].includes(status)) {
      return res.status(400).json({ message: 'Statut invalide' });
    }
    const tache = await Tache.findOneAndUpdate(
      { _id: id, user: req.user._id },
      { status },
      { new: true }
    );
    if (!tache) {
      return res.status(404).json({ message: 'Tâche non trouvée ou non autorisée' });
    }
    res.json({ message: 'Tâche mise à jour avec succès' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur lors de la mise à jour de la tâche' });
  }
});

module.exports = router;