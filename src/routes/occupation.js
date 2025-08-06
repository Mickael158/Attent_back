const express = require('express');
const mongoose = require('mongoose');
const Occupation = require('../models/Occupation');
const roleMiddleware = require('../middleware/roleMiddleware');
const refreshTokenMiddleware = require('../middleware/refreshTokenMiddleware');
const router = express.Router();

// Récupérer le statut d'occupation de l'utilisateur connecté
router.get('/user',refreshTokenMiddleware, roleMiddleware(['box']), async (req, res) => {
  try {
    const userId = req.user._id;
    const occupation = await Occupation.findOne({ users: userId });
    if (!occupation) {
      return res.json({ status: 'inactive' }); // Statut par défaut si aucune occupation
    }
    res.json(occupation);
  } catch (error) {
    console.error('Erreur lors de la récupération du statut d\'occupation :', error);
    res.status(500).json({ message: 'Erreur serveur lors de la récupération du statut d\'occupation' });
  }
});

// Mettre à jour le statut d'occupation
router.put('/user',refreshTokenMiddleware, roleMiddleware(['box']), async (req, res) => {
  try {
    const userId = req.user._id;
    const { status } = req.body;
    if (!['active', 'inactive'].includes(status)) {
      return res.status(400).json({ message: 'Statut invalide' });
    }
    let occupation = await Occupation.findOne({ users: userId });
    if (!occupation) {
      occupation = new Occupation({ users: [userId], status });
    } else {
      occupation.status = status;
    }
    await occupation.save();
    res.json({ message: 'Statut mis à jour avec succès' });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du statut d\'occupation :', error);
    res.status(500).json({ message: 'Erreur serveur lors de la mise à jour du statut d\'occupation' });
  }
});

module.exports = router;