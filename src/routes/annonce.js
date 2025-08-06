const express = require('express');
const Annonce = require('../models/Annonce');
const refreshTokenMiddleware = require('../middleware/refreshTokenMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const router = express.Router();

// Route pour créer une annonce
router.post('/annonces', refreshTokenMiddleware, roleMiddleware(['admin']), async (req, res) => {
  const { texte } = req.body;
  try {
    if (!texte) {
      return res.status(400).json({ message: 'Le texte de l\'annonce est requis.' });
    }
    const annonce = new Annonce({ texte });
    const createdAnnonce = await annonce.save();
    res.status(201).json(createdAnnonce);
  } catch (error) {
    console.error('Erreur lors de la création de l\'annonce:', error);
    res.status(500).json({ message: error.message });
  }
});

// Route pour mettre à jour une annonce
router.put('/annonces', refreshTokenMiddleware, roleMiddleware(['admin']), async (req, res) => {
  const { texte } = req.body;
  try {
    if (!texte) {
      return res.status(400).json({ message: 'Le texte de l\'annonce est requis.' });
    }
    const existingAnnonce = await Annonce.findOne();
    if (existingAnnonce) {
      const updatedAnnonce = await Annonce.findByIdAndUpdate(
        existingAnnonce._id,
        { texte },
        { new: true, runValidators: true }
      );
      return res.json({ message: 'Annonce mise à jour avec succès.', texte: updatedAnnonce.texte });
    }
    const annonce = new Annonce({ texte });
    const createdAnnonce = await annonce.save();
    res.status(201).json({ message: 'Annonce créée avec succès.', texte: createdAnnonce.texte });
  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'annonce:', error);
    res.status(500).json({ message: error.message });
  }
});

// Route pour récupérer toutes les annonces
router.get('/annonces', refreshTokenMiddleware, roleMiddleware(['admin', 'affichage']), async (req, res) => {
  try {
    const annonces = await Annonce.find();
    res.json(annonces);
  } catch (error) {
    console.error('Erreur lors de la récupération des annonces:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;