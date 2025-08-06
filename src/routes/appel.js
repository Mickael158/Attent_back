const express = require('express');
const mongoose = require('mongoose');
const Appel = require('../models/Appel');
const Liste = require('../models/Liste');
const User = require('../models/User');
const Role = require('../models/Role');
const Tache = require('../models/Tache');
const Occupation = require('../models/Occupation');
const Place = require('../models/Place');
const refreshTokenMiddleware = require('../middleware/refreshTokenMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const router = express.Router();

// Route pour assigner le prochain client à un utilisateur "box" libre
router.post('/assign', refreshTokenMiddleware, roleMiddleware(['admin', 'affichage']), async (req, res) => {
  try {
    // Étape 1 : Récupérer la date d'aujourd'hui (début et fin de journée)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    // Étape 2 : Trouver les clients non attribués dans Liste pour aujourd'hui
    const clients = await Liste.find({
      dateHeure: { $gte: today, $lt: tomorrow },
      _id: { $nin: await Appel.find().distinct('liste') } // Exclure les clients déjà attribués
    })
      .sort({ dateHeure: 1 }) // Premier arrivé, premier servi
      .populate('id_prestation');

    if (!clients || clients.length === 0) {
      return res.status(404).json({ message: 'Aucun client en attente aujourd\'hui.' });
    }

    // Étape 3 : Trouver les utilisateurs avec le rôle "box"
    const boxRole = await Role.findOne({ nom: 'box' });
    if (!boxRole) {
      return res.status(404).json({ message: 'Rôle "box" non trouvé.' });
    }

    const boxUsers = await User.find({ idRoles: boxRole._id, isValidated: true });

    if (!boxUsers || boxUsers.length === 0) {
      return res.status(404).json({ message: 'Aucun utilisateur avec le rôle "box" disponible.' });
    }

    // Étape 4 : Pour le premier client, trouver un utilisateur libre avec la tâche appropriée
    const client = clients[0]; // Premier client en attente
    const prestationId = client.id_prestation;

    // Trouver les utilisateurs libres (Occupation active) avec la tâche active pour la prestation
    const availableUsers = await Promise.all(
      boxUsers.map(async (user) => {
        const isActive = await Occupation.findOne({
          users: user._id,
          status: 'active'
        });

        const hasTache = await Tache.findOne({
          user: user._id,
          prestation: prestationId,
          status: 'active'
        });

        return isActive && hasTache ? user : null;
      })
    );

    const freeUser = availableUsers.find(user => user !== null);

    if (!freeUser) {
      return res.status(404).json({ message: 'Aucun utilisateur "box" libre avec la tâche requise.' });
    }

    // Étape 5 : Trouver la place associée à l'utilisateur
    const place = await Place.findOne({ user: freeUser._id });
    if (!place) {
      return res.status(404).json({ message: 'Aucune place associée à l\'utilisateur.' });
    }

    // Étape 6 : Créer un nouvel appel
    const newAppel = new Appel({
      user: freeUser._id,
      liste: client._id,
      date: new Date()
    });

    await newAppel.save();

    // Étape 7 : Réponse avec les détails
    res.status(201).json({
      message: 'Client attribué avec succès.',
      appel: {
        user: freeUser.mail,
        ticket: client.numero,
        prestation: client.id_prestation.nom,
        date: newAppel.date,
        place: {
          ref_place: place.ref_place,
          numero: place.numero
        }
      }
    });

  } catch (error) {
    console.error('Erreur lors de l\'attribution du client:', error);
    res.status(500).json({ message: error.message || 'Erreur serveur lors de l\'attribution.' });
  }
});

// Route pour récupérer les appels récents
router.get('/appels', refreshTokenMiddleware, roleMiddleware(['admin', 'affichage']), async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const appels = await Appel.find({
      date: { $gte: today, $lt: tomorrow }
    })
      .populate({
        path: 'liste',
        populate: { path: 'id_prestation' }
      })
      .populate({
        path: 'user',
        populate: { path: 'idRoles' }
      })
      .sort({ date: -1 }) // Les plus récents d'abord
      .limit(5); // Limiter à 5 appels

    // Récupérer les places pour chaque utilisateur
    const formattedAppels = await Promise.all(
      appels.map(async (appel) => {
        const place = await Place.findOne({ user: appel.user._id });
        return {
          _id: appel._id,
          liste: {
            numero: appel.liste.numero
          },
          place: place ? {
            ref_place: place.ref_place,
            numero: place.numero
          } : {
            ref_place: 'Guichet inconnu',
            numero: 'N/A'
          },
          date: appel.date
        };
      })
    );

    res.json(formattedAppels);
  } catch (error) {
    console.error('Erreur lors de la récupération des appels:', error);
    res.status(500).json({ message: error.message || 'Erreur serveur lors de la récupération des appels.' });
  }
});

// Route pour récupérer le nombre de clients en attente
router.get('/clients-en-attente', refreshTokenMiddleware, roleMiddleware(['box']), async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const clients = await Liste.find({
      dateHeure: { $gte: today, $lt: tomorrow },
      _id: { $nin: await Appel.find().distinct('liste') }
    });

    res.json({ count: clients.length });
  } catch (error) {
    console.error('Erreur lors de la récupération du nombre de clients en attente:', error);
    res.status(500).json({ message: error.message || 'Erreur serveur lors de la récupération des clients en attente.' });
  }
});


// Route pour les statistiques des clients reçus par mois
router.get('/stats/clients-par-mois', refreshTokenMiddleware, roleMiddleware(['admin']), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    // Définir la plage de dates par défaut (12 derniers mois)
    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate ? new Date(startDate) : new Date(new Date().setFullYear(end.getFullYear() - 1));
    
    // S'assurer que les dates sont valides
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) {
      return res.status(400).json({ message: 'Plage de dates invalide.' });
    }

    // Agrégation pour compter les appels par mois
    const stats = await Appel.aggregate([
      {
        $match: {
          date: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);

    // Formater les étiquettes (ex. "Jan 2024") et les données
    const labels = [];
    const data = [];
    stats.forEach(stat => {
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      labels.push(`${monthNames[stat._id.month - 1]} ${stat._id.year}`);
      data.push(stat.count);
    });

    res.json({ labels, data });
  } catch (error) {
    console.error('Erreur lors de la récupération des stats clients par mois:', error);
    res.status(500).json({ message: error.message || 'Erreur serveur lors de la récupération des stats.' });
  }
});

// Route pour les statistiques des clients reçus par prestation
router.get('/stats/clients-par-prestation', refreshTokenMiddleware, roleMiddleware(['admin']), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    // Définir la plage de dates par défaut (12 derniers mois)
    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate ? new Date(startDate) : new Date(new Date().setFullYear(end.getFullYear() - 1));
    
    // S'assurer que les dates sont valides
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) {
      return res.status(400).json({ message: 'Plage de dates invalide.' });
    }

    // Agrégation pour compter les appels par prestation
    const stats = await Appel.aggregate([
      {
        $match: {
          date: { $gte: start, $lte: end }
        }
      },
      {
        $lookup: {
          from: 'listes',
          localField: 'liste',
          foreignField: '_id',
          as: 'liste'
        }
      },
      {
        $unwind: '$liste'
      },
      {
        $lookup: {
          from: 'prestations',
          localField: 'liste.id_prestation',
          foreignField: '_id',
          as: 'prestation'
        }
      },
      {
        $unwind: '$prestation'
      },
      {
        $group: {
          _id: '$prestation.nom',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    // Formater les étiquettes (noms des prestations) et les données
    const labels = stats.map(stat => stat._id || 'Inconnu');
    const data = stats.map(stat => stat.count);

    res.json({ labels, data });
  } catch (error) {
    console.error('Erreur lors de la récupération des stats clients par prestation:', error);
    res.status(500).json({ message: error.message || 'Erreur serveur lors de la récupération des stats.' });
  }
});

module.exports = router;