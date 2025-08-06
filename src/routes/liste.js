const express = require('express');
const Prestation = require('../models/Prestation');
const Liste = require('../models/Liste');
const refreshTokenMiddleware = require('../middleware/refreshTokenMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const router = express.Router();

// Route pour créer une nouvelle entrée dans Liste
// - Reçoit une référence (ref) dans le corps de la requête
// - Vérifie l'existence de la prestation
// - Génère un numéro unique (<ref>-<num>) pour le jour actuel
// - Vérifie l'unicité du numéro uniquement pour aujourd'hui
router.post('/liste', refreshTokenMiddleware, roleMiddleware(['port']), async (req, res) => {
  const { ref } = req.body;
  console.log(`Requête POST /liste reçue avec ref: ${ref}`);
  let numero; // Définir numero à l'extérieur du try pour le rendre accessible dans catch

  try {
    // Vérifier que la référence est fournie
    if (!ref) {
      console.log('Erreur: Référence manquante dans le corps de la requête');
      return res.status(400).json({ message: 'Référence de prestation requise.' });
    }

    // Rechercher la prestation par sa référence
    const prestation = await Prestation.findOne({ ref });
    if (!prestation) {
      console.log(`Erreur: Prestation non trouvée pour ref: ${ref}`);
      return res.status(404).json({ message: `Prestation non trouvée pour la référence: ${ref}` });
    }

    // Obtenir la date actuelle sans l’heure
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Rechercher les entrées du jour pour cette prestation
    const todayListes = await Liste.find({
      id_prestation: prestation._id,
      dateHeure: { $gte: today },
    });

    // Génération du numéro
    const nextNum = todayListes.length > 0 ? todayListes.length + 1 : 1;
    numero = `${prestation.ref}-${nextNum}`; // Définir numero

    // Vérifier si le numéro existe déjà pour aujourd'hui
    const existingListe = await Liste.findOne({
      numero,
      dateHeure: { $gte: today },
    });
    if (existingListe) {
      console.log(`Erreur: Numéro ${numero} déjà existant pour aujourd'hui`);
      return res.status(409).json({ message: `Numéro ${numero} déjà utilisé aujourd'hui.` });
    }

    const newListe = new Liste({
      dateHeure: new Date(),
      numero: numero,
      id_prestation: prestation._id,
    });

    await newListe.save();
    console.log(`Entrée Liste créée: ${JSON.stringify(newListe)}`);
    res.status(201).json(newListe);
  } catch (error) {
    console.error('Erreur lors de la création de l\'entrée dans Liste:', error);
    res.status(500).json({
      message: `Erreur serveur lors de la création de l'entrée: ${error.message}`,
      numero: numero || 'inconnu',
    });
  }
});

module.exports = router;