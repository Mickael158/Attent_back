const express = require('express');
const Prestation = require('../models/Prestation'); // Modèle Prestation
const refreshTokenMiddleware = require('../middleware/refreshTokenMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const router = express.Router();

// Données du CSV structurées pour l'insertion
const csvData = [
  // RENSEIGNEMENT
  { nom: 'RENSEIGNEMENT_OFFRE SANLAMALLIANZ_ASSURANCE VIE', ref: 'SAZ - REN' },
  { nom: 'RENSEIGNEMENT_OFFRE SANLAMALLIANZ_ASSURANCE NON VIE', ref: 'SAZ - REN' },
  // PAIEMENT / CAISSE
  { nom: 'PAIEMENT / CAISSE_SOUSCRIPTION', ref: 'SAZ - CAI' },
  { nom: 'PAIEMENT / CAISSE_RENOUVELLEMENT', ref: 'SAZ - CAI' },
  { nom: 'PAIEMENT / CAISSE_INCORPORATION', ref: 'SAZ - CAI' },
  // SOUSCRIPTION
  { nom: 'SOUSCRIPTION_ASSURANCE VIE_RETRAITE', ref: 'SAZ - SOU' },
  { nom: 'SOUSCRIPTION_ASSURANCE VIE_RENTE EDUCATION', ref: 'SAZ - SOU' },
  { nom: 'SOUSCRIPTION_ASSURANCE VIE_EPARGNE EDUCATION', ref: 'SAZ - SOU' },
  { nom: 'SOUSCRIPTION_ASSURANCE VIE_DÉCÈS', ref: 'SAZ - SOU' },
  { nom: 'SOUSCRIPTION_ASSURANCE NON VIE_AUTO', ref: 'SAZ - SOU' },
  { nom: 'SOUSCRIPTION_ASSURANCE NON VIE_HABITATION', ref: 'SAZ - SOU' },
  { nom: 'SOUSCRIPTION_ASSURANCE NON VIE_SANTÉ', ref: 'SAZ - SOU' },
  { nom: 'SOUSCRIPTION_ASSURANCE NON VIE_RESPONSABILITÉ CIVILE CHEF DE FAMILLE', ref: 'SAZ - SOU' },
  { nom: 'SOUSCRIPTION_ASSURANCE NON VIE_RESPONSABILITÉ CIVILE - PARTICULIER', ref: 'SAZ - SOU' },
  { nom: 'SOUSCRIPTION_ASSURANCE NON VIE_RESPONSABILITÉ CIVILE - ENTREPRISE', ref: 'SAZ - SOU' },
  { nom: 'SOUSCRIPTION_ASSURANCE NON VIE_MULTIRISQUES PROFESSIONNELLE', ref: 'SAZ - SOU' },
  { nom: 'SOUSCRIPTION_ASSURANCE NON VIE_TRANSPORT / NAVIGATION DE PLAISANCE', ref: 'SAZ - SOU' },
  { nom: 'SOUSCRIPTION_ASSURANCE NON VIE_INDIVIDUEL ACCIDENT', ref: 'SAZ - SOU' },
  { nom: 'SOUSCRIPTION_ASSURANCE NON VIE_RC STAGIAIRE', ref: 'SAZ - SOU' },
  { nom: 'SOUSCRIPTION_ASSURANCE NON VIE_RC SCOLAIRE', ref: 'SAZ - SOU' },
  { nom: 'SOUSCRIPTION_ASSURANCE NON VIE_VOYAGE', ref: 'SAZ - SOU' },
  // RENOUVELEMENT
  { nom: 'RENOUVELLEMENT_ASSURANCE VIE_RETRAITE', ref: 'SAZ - REN' },
  { nom: 'RENOUVELLEMENT_ASSURANCE VIE_RENTE EDUCATION', ref: 'SAZ - REN' },
  { nom: 'RENOUVELLEMENT_ASSURANCE VIE_EPARGNE EDUCATION', ref: 'SAZ - REN' },
  { nom: 'RENOUVELLEMENT_ASSURANCE VIE_DÉCÈS', ref: 'SAZ - REN' },
  { nom: 'RENOUVELLEMENT_ASSURANCE NON VIE_AUTO', ref: 'SAZ - REN' },
  { nom: 'RENOUVELLEMENT_ASSURANCE NON VIE_HABITATION', ref: 'SAZ - REN' },
  { nom: 'RENOUVELLEMENT_ASSURANCE NON VIE_SANTÉ', ref: 'SAZ - REN' },
  { nom: 'RENOUVELLEMENT_ASSURANCE NON VIE_RESPONSABILITÉ CIVILE CHEF DE FAMILLE', ref: 'SAZ - REN' },
  { nom: 'RENOUVELLEMENT_ASSURANCE NON VIE_RESPONSABILITÉ CIVILE - PARTICULIER', ref: 'SAZ - REN' },
  { nom: 'RENOUVELLEMENT_ASSURANCE NON VIE_RESPONSABILITÉ CIVILE - ENTREPRISE', ref: 'SAZ - REN' },
  { nom: 'RENOUVELLEMENT_ASSURANCE NON VIE_MULTIRISQUES PROFESSIONNELLE', ref: 'SAZ - REN' },
  { nom: 'RENOUVELLEMENT_ASSURANCE NON VIE_TRANSPORT / NAVIGATION DE PLAISANCE', ref: 'SAZ - REN' },
  { nom: 'RENOUVELLEMENT_ASSURANCE NON VIE_INDIVIDUEL ACCIDENT', ref: 'SAZ - REN' },
  { nom: 'RENOUVELLEMENT_ASSURANCE NON VIE_RC STAGIAIRE', ref: 'SAZ - REN' },
  { nom: 'RENOUVELLEMENT_ASSURANCE NON VIE_RC SCOLAIRE', ref: 'SAZ - REN' },
  { nom: 'RENOUVELLEMENT_ASSURANCE NON VIE_VOYAGE', ref: 'SAZ - REN' },
  // INCORPORATION
  { nom: 'INCORPORATION_ASSURANCE VIE_RETRAITE', ref: 'SAZ - INC' },
  { nom: 'INCORPORATION_ASSURANCE VIE_RENTE EDUCATION', ref: 'SAZ - INC' },
  { nom: 'INCORPORATION_ASSURANCE VIE_EPARGNE EDUCATION', ref: 'SAZ - INC' },
  { nom: 'INCORPORATION_ASSURANCE VIE_DÉCÈS', ref: 'SAZ - INC' },
  { nom: 'INCORPORATION_ASSURANCE NON VIE_AUTO', ref: 'SAZ - INC' },
  { nom: 'INCORPORATION_ASSURANCE NON VIE_HABITATION', ref: 'SAZ - INC' },
  { nom: 'INCORPORATION_ASSURANCE NON VIE_SANTÉ', ref: 'SAZ - INC' },
  { nom: 'INCORPORATION_ASSURANCE NON VIE_RESPONSABILITÉ CIVILE CHEF DE FAMILLE', ref: 'SAZ - INC' },
  { nom: 'INCORPORATION_ASSURANCE NON VIE_RESPONSABILITÉ CIVILE - PARTICULIER', ref: 'SAZ - INC' },
  { nom: 'INCORPORATION_ASSURANCE NON VIE_RESPONSABILITÉ CIVILE - ENTREPRISE', ref: 'SAZ - INC' },
  { nom: 'INCORPORATION_ASSURANCE NON VIE_MULTIRISQUES PROFESSIONNELLE', ref: 'SAZ - INC' },
  { nom: 'INCORPORATION_ASSURANCE NON VIE_TRANSPORT / NAVIGATION DE PLAISANCE', ref: 'SAZ - INC' },
  { nom: 'INCORPORATION_ASSURANCE NON VIE_INDIVIDUEL ACCIDENT', ref: 'SAZ - INC' },
  { nom: 'INCORPORATION_ASSURANCE NON VIE_RC STAGIAIRE', ref: 'SAZ - INC' },
  { nom: 'INCORPORATION_ASSURANCE NON VIE_RC SCOLAIRE', ref: 'SAZ - INC' },
  { nom: 'INCORPORATION_ASSURANCE NON VIE_VOYAGE', ref: 'SAZ - INC' },
  // RETRAIT
  { nom: 'RETRAIT_ASSURANCE VIE_RETRAITE', ref: 'SAZ - RET' },
  { nom: 'RETRAIT_ASSURANCE VIE_RENTE EDUCATION', ref: 'SAZ - RET' },
  { nom: 'RETRAIT_ASSURANCE VIE_EPARGNE EDUCATION', ref: 'SAZ - RET' },
  { nom: 'RETRAIT_ASSURANCE VIE_DÉCÈS', ref: 'SAZ - RET' },
  { nom: 'RETRAIT_ASSURANCE NON VIE_AUTO', ref: 'SAZ - RET' },
  { nom: 'RETRAIT_ASSURANCE NON VIE_HABITATION', ref: 'SAZ - RET' },
  { nom: 'RETRAIT_ASSURANCE NON VIE_SANTÉ', ref: 'SAZ - RET' },
  { nom: 'RETRAIT_ASSURANCE NON VIE_RESPONSABILITÉ CIVILE CHEF DE FAMILLE', ref: 'SAZ - RET' },
  { nom: 'RETRAIT_ASSURANCE NON VIE_RESPONSABILITÉ CIVILE - PARTICULIER', ref: 'SAZ - RET' },
  { nom: 'RETRAIT_ASSURANCE NON VIE_RESPONSABILITÉ CIVILE - ENTREPRISE', ref: 'SAZ - RET' },
  { nom: 'RETRAIT_ASSURANCE NON VIE_MULTIRISQUES PROFESSIONNELLE', ref: 'SAZ - RET' },
  { nom: 'RETRAIT_ASSURANCE NON VIE_TRANSPORT / NAVIGATION DE PLAISANCE', ref: 'SAZ - RET' },
  { nom: 'RETRAIT_ASSURANCE NON VIE_INDIVIDUEL ACCIDENT', ref: 'SAZ - RET' },
  { nom: 'RETRAIT_ASSURANCE NON VIE_RC STAGIAIRE', ref: 'SAZ - RET' },
  { nom: 'RETRAIT_ASSURANCE NON VIE_RC SCOLAIRE', ref: 'SAZ - RET' },
  { nom: 'RETRAIT_ASSURANCE NON VIE_VOYAGE', ref: 'SAZ - RET' },
  // RESILIATION
  { nom: 'RESILIATION_ASSURANCE VIE_RETRAITE', ref: 'SAZ - RES' },
  { nom: 'RESILIATION_ASSURANCE VIE_RENTE EDUCATION', ref: 'SAZ - RES' },
  { nom: 'RESILIATION_ASSURANCE VIE_EPARGNE EDUCATION', ref: 'SAZ - RES' },
  { nom: 'RESILIATION_ASSURANCE VIE_DÉCÈS', ref: 'SAZ - RES' },
  { nom: 'RESILIATION_ASSURANCE NON VIE_AUTO', ref: 'SAZ - RES' },
  { nom: 'RESILIATION_ASSURANCE NON VIE_HABITATION', ref: 'SAZ - RES' },
  { nom: 'RESILIATION_ASSURANCE NON VIE_SANTÉ', ref: 'SAZ - RES' },
  { nom: 'RESILIATION_ASSURANCE NON VIE_RESPONSABILITÉ CIVILE CHEF DE FAMILLE', ref: 'SAZ - RES' },
  { nom: 'RESILIATION_ASSURANCE NON VIE_RESPONSABILITÉ CIVILE - PARTICULIER', ref: 'SAZ - RES' },
  { nom: 'RESILIATION_ASSURANCE NON VIE_RESPONSABILITÉ CIVILE - ENTREPRISE', ref: 'SAZ - RES' },
  { nom: 'RESILIATION_ASSURANCE NON VIE_MULTIRISQUES PROFESSIONNELLE', ref: 'SAZ - RES' },
  { nom: 'RESILIATION_ASSURANCE NON VIE_TRANSPORT / NAVIGATION DE PLAISANCE', ref: 'SAZ - RES' },
  { nom: 'RESILIATION_ASSURANCE NON VIE_INDIVIDUEL ACCIDENT', ref: 'SAZ - RES' },
  { nom: 'RESILIATION_ASSURANCE NON VIE_RC STAGIAIRE', ref: 'SAZ - RES' },
  { nom: 'RESILIATION_ASSURANCE NON VIE_RC SCOLAIRE', ref: 'SAZ - RES' },
  { nom: 'RESILIATION_ASSURANCE NON VIE_VOYAGE', ref: 'SAZ - RES' },
  // DECLARATION SINISTRES
  { nom: 'DECLARATION SINISTRES_ASSURANCE VIE_PARTICULIER', ref: 'SAZ - DES' },
  { nom: 'DECLARATION SINISTRES_ASSURANCE VIE_ENTREPRISE', ref: 'SAZ - DES' },
  { nom: 'DECLARATION SINISTRES_ASSURANCE NON VIE_PARTICULIER', ref: 'SAZ - DES' },
  { nom: 'DECLARATION SINISTRES_ASSURANCE NON VIE_ENTREPRISE', ref: 'SAZ - DES' },
  // PRISE EN CHARGE
  { nom: 'PRISE EN CHARGE_MCI CARE_ASSURANCE SANTÉ', ref: 'MCI - PEC' },
  // REMBOURSEMENT
  { nom: 'REMBOURSEMENT_ASSURANCE VOYAGE', ref: 'SAZ - REM' },
  { nom: 'REMBOURSEMENT_AUTRES', ref: 'SAZ - REM' },
  // SUIVI DES DOSSIERS
  { nom: 'SUIVI DES DOSSIERS_ASSURANCE VIE_PARTICULIER', ref: 'SAZ - SDD' },
  { nom: 'SUIVI DES DOSSIERS_ASSURANCE VIE_ENTREPRISE', ref: 'SAZ - SDD' },
  { nom: 'SUIVI DES DOSSIERS_ASSURANCE NON VIE_PARTICULIER', ref: 'SAZ - SDD' },
  { nom: 'SUIVI DES DOSSIERS_ASSURANCE NON VIE_ENTREPRISE', ref: 'SAZ - SDD' },
  // RETOURS CLIENTS
  { nom: 'RETOURS CLIENTS_RECLAMATION_PARTICULIER', ref: 'SAZ - RCL' },
  { nom: 'RETOURS CLIENTS_RECLAMATION_ENTREPRISE', ref: 'SAZ - RCL' },
  { nom: 'RETOURS CLIENTS_SATISFACTION_PARTICULIER', ref: 'SAZ - RCL' },
  { nom: 'RETOURS CLIENTS_SATISFACTION_ENTREPRISE', ref: 'SAZ - RCL' }
];

// Insérer les prestations en masse à partir des données du CSV (accessible uniquement aux administrateurs)
router.post('/bulk', refreshTokenMiddleware, roleMiddleware(['admin']), async (req, res) => {
    try {
        // Vérifier si des prestations existent déjà pour éviter les doublons
        const existingPrestations = await Prestation.find({}, 'ref');
        const existingRefs = new Set(existingPrestations.map(p => p.ref));

        // Filtrer les prestations à insérer (exclure celles avec des refs déjà existantes)
        const prestationsToInsert = csvData.filter(prestation => !existingRefs.has(prestation.ref));

        if (prestationsToInsert.length === 0) {
            return res.status(200).json({ message: 'Aucune nouvelle prestation à insérer (toutes les références existent déjà).' });
        }

        // Insérer les nouvelles prestations
        const insertedPrestations = await Prestation.insertMany(prestationsToInsert);
        res.status(201).json({
            message: `${insertedPrestations.length} prestations insérées avec succès.`,
            insertedPrestations
        });
    } catch (error) {
        res.status(400).json({ message: `Erreur lors de l'insertion des prestations : ${error.message}` });
    }
});

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