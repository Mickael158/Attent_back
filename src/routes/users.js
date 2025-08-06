const express = require('express');
const mongoose = require('mongoose');
const User = require('../models/User');
const Occupation = require('../models/Occupation');
const Place = require('../models/Place');
const Tache = require('../models/Tache');
const Prestation = require('../models/Prestation');
const Role = require('../models/Role');
const roleMiddleware = require('../middleware/roleMiddleware');
const router = express.Router();
const { SECRET_KEY } = require('../config/config');
const refreshTokenMiddleware = require('../middleware/refreshTokenMiddleware');

// Route pour lister les utilisateurs en attente de validation (isValidated: false, rôle: box)
router.get('/pending',refreshTokenMiddleware, roleMiddleware(['admin']), async (req, res) => {
  try {
    // Récupère les utilisateurs avec isValidated: false et rôle 'box'
    const pendingUsers = await User.find({ isValidated: false })
      .populate('idRoles') // Remplit les détails du rôle, si idRoles existe
      .select('mail idRoles isValidated'); // Limite les champs renvoyés
    // Filtre les utilisateurs pour ne garder que ceux avec idRoles.nom === 'box'
    const filteredUsers = pendingUsers.filter(user => user.idRoles && user.idRoles.nom === 'box');
    res.json(filteredUsers); // Envoie la liste au frontend
  } catch (error) {
    // Gère les erreurs serveur (par exemple, problème de connexion à MongoDB)
    console.error('Erreur lors de la récupération des utilisateurs en attente :', error);
    res.status(500).json({ message: 'Erreur serveur lors de la récupération des utilisateurs en attente' });
  }
});

// Route pour lister les utilisateurs validés (isValidated: true, rôle: box)
router.get('/validated',refreshTokenMiddleware, roleMiddleware(['admin']), async (req, res) => {
  try {
    // Récupère les utilisateurs avec isValidated: true et rôle 'box'
    const validatedUsers = await User.find({ isValidated: true })
      .populate('idRoles') // Remplit les détails du rôle, si idRoles existe
      .select('mail idRoles isValidated'); // Limite les champs renvoyés
    // Filtre les utilisateurs pour ne garder que ceux avec idRoles.nom === 'box'
    const filteredUsers = validatedUsers.filter(user => user.idRoles && user.idRoles.nom === 'box');
    res.json(filteredUsers); // Envoie la liste au frontend
  } catch (error) {
    // Gère les erreurs serveur
    console.error('Erreur lors de la récupération des utilisateurs validés :', error);
    res.status(500).json({ message: 'Erreur serveur lors de la récupération des utilisateurs validés' });
  }
});

// Route pour valider un utilisateur
router.put('/validate/:id',refreshTokenMiddleware, roleMiddleware(['admin']), async (req, res) => {
  try {
    // Vérifie que l'ID est un ObjectId valide
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'ID d\'utilisateur invalide' });
    }

    // Recherche l'utilisateur par ID et remplit les détails du rôle
    const user = await User.findById(req.params.id).populate('idRoles');
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    // Vérifie que l'utilisateur a un rôle et que c'est 'box'
    if (!user.idRoles || user.idRoles.nom !== 'box') {
      return res.status(400).json({ message: 'Seuls les utilisateurs avec le rôle box peuvent être validés' });
    }

    // Vérifie si l'utilisateur est déjà validé
    if (user.isValidated) {
      return res.status(400).json({ message: 'Utilisateur déjà validé' });
    }

    // Met à jour le statut de validation
    user.isValidated = true;
    await user.save();

    // a) Insère l'utilisateur dans la collection Occupation avec status: 'inactive'
    const occupation = new Occupation({
      users: [user._id],
      status: 'inactive'
    });
    await occupation.save();

    // b) Insère l'utilisateur dans la collection Place avec des données par défaut
    const place = new Place({
      user: user._id,
      numero: `BOX-ParDefaut`, // Génère un numéro unique basé sur les 4 derniers caractères de l'ID
      ref_place: `REF-ParDefaut` // Génère une référence basée sur le timestamp
    });
    await place.save();

    // c) Insère l'utilisateur dans la collection Tache pour chaque prestation
    const prestations = await Prestation.find(); // Récupère toutes les prestations
    if (prestations.length === 0) {
      console.warn('Aucune prestation trouvée pour créer des tâches');
    }
    const taches = prestations.map(prestation => ({
      user: user._id,
      prestation: prestation._id,
      status: 'inactive'
    }));
    if (taches.length > 0) {
      await Tache.insertMany(taches); // Insère toutes les tâches en une seule opération
    }

    // Envoie une réponse de succès au frontend
    res.json({ message: 'Utilisateur validé avec succès' });
  } catch (error) {
    // Gère les erreurs serveur (par exemple, échec de sauvegarde ou problème avec Prestation)
    console.error('Erreur lors de la validation de l\'utilisateur :', error);
    res.status(500).json({ message: 'Erreur serveur lors de la validation de l\'utilisateur' });
  }
});

// Route pour supprimer un utilisateur
router.delete('/:id',refreshTokenMiddleware, roleMiddleware(['admin']), async (req, res) => {
  try {
    // Vérifie que l'ID est un ObjectId valide
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'ID d\'utilisateur invalide' });
    }

    // Supprime l'utilisateur par ID
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    // Supprime les entrées associées dans Occupation, Place et Tache
    await Occupation.deleteMany({ users: user._id });
    await Place.deleteMany({ user: user._id });
    await Tache.deleteMany({ user: user._id });

    // Envoie une réponse de succès au frontend
    res.json({ message: 'Utilisateur supprimé avec succès' });
  } catch (error) {
    // Gère les erreurs serveur
    console.error('Erreur lors de la suppression de l\'utilisateur :', error);
    res.status(500).json({ message: 'Erreur serveur lors de la suppression de l\'utilisateur' });
  }
});

module.exports = router;