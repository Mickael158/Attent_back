const express = require('express');
const Role = require('../models/Role');
const router = express.Router();
const authMiddleware = require('../middleware/refreshTokenMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware'); 

// === ROUTE POUR INSÉRER LES RÔLES PAR DÉFAUT ===
router.post('/seed', async (req, res) => {
    const defaultRoles = ['admin', 'box', 'affichage' , 'port'];

    try {
        // Récupère les rôles déjà existants
        const existingRoles = await Role.find({ nom: { $in: defaultRoles } });
        const existingNames = existingRoles.map(r => r.nom);

        // Filtre les rôles manquants
        const missingRoles = defaultRoles
            .filter(name => !existingNames.includes(name))
            .map(name => ({ nom: name }));

        if (missingRoles.length === 0) {
            return res.status(200).json({
                message: 'Tous les rôles par défaut existent déjà.',
                roles: existingRoles
            });
        }

        // Insère les rôles manquants
        const insertedRoles = await Role.insertMany(missingRoles);

        res.status(201).json({
            message: `${insertedRoles.length} rôle(s) inséré(s) avec succès.`,
            roles: insertedRoles
        });

    } catch (error) {
        console.error('Erreur seeding rôles :', error);
        res.status(500).json({
            message: 'Erreur lors de l\'insertion des rôles',
            error: error.message
        });
    }
});

// === TES ROUTES EXISTANTES ===
router.post('/', async (req, res) => {
    const { nom } = req.body;

    try {
        const role = new Role({ nom });
        await role.save();
        res.status(201).send(role);
    } catch (error) {
        res.status(400).send({ message: 'Erreur lors de la création du rôle', error });
    }
});

router.get('/', async (req, res) => {
    const roles = await Role.find();
    res.send(roles);
});

module.exports = router;