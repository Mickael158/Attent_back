const express = require('express');
const mongoose = require('mongoose');
const Place = require('../models/Place');
const roleMiddleware = require('../middleware/roleMiddleware');
const refreshTokenMiddleware = require('../middleware/refreshTokenMiddleware');
const router = express.Router();

// Récupérer la place de l'utilisateur connecté
router.get('/user', refreshTokenMiddleware, roleMiddleware(['box']), async (req, res) => {
  try {
    const userId = req.user._id; // Supposé depuis le middleware d'authentification
    
    const place = await Place.findOne({ user: userId });
    if (!place) {
      return res.json({ numero: '', ref_place: '' }); // Retourne des valeurs vides si aucune place
    }
    res.json(place);
  } catch (error) {
    console.error('Erreur lors de la récupération de la place :', error);
    res.status(500).json({ message: 'Erreur serveur lors de la récupération de la place' });
  }
});

// Mettre à jour la place de l'utilisateur
router.put('/user', refreshTokenMiddleware, roleMiddleware(['box']), async (req, res) => {
  try {
    const userId = req.user._id;
    const { numero, ref_place } = req.body;
    if (!numero || !ref_place) {
      return res.status(400).json({ message: 'Numéro et référence de la place sont requis' });
    }
    let place = await Place.findOne({ user: userId });
    if (!place) {
      place = new Place({ user: userId, numero, ref_place });
    } else {
      place.numero = numero;
      place.ref_place = ref_place;
    }
    await place.save();
    res.json({ message: 'Place mise à jour avec succès' });
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la place :', error);
    res.status(500).json({ message: 'Erreur serveur lors de la mise à jour de la place' });
  }
});

module.exports = router;