const express = require('express');
const Role = require('../models/Role');
const router = express.Router();
const authMiddleware = require('../middleware/refreshTokenMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware'); 

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