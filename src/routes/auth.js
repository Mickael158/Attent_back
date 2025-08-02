const express = require('express');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const refreshTokenMiddleware = require('../middleware/refreshTokenMiddleware'); 
const router = express.Router();
const { SECRET_KEY } = require('../config/config');
const Role = require('../models/Role');

router.post('/register', async (req, res) => {
    const { mail, pwsd, nomRole } = req.body; 
    try {
        const existingUser = await User.findOne({ mail });
        if (existingUser) {
            return res.status(400).send('Cet email est déjà utilisé.');
        }

        const role = await Role.findOne({ nom: nomRole });
        if (!role) {
            return res.status(400).send('Rôle non trouvé.');
        }

        const hashedPassword = await bcrypt.hash(pwsd, 10);
        const user = new User({ mail, pwsd: hashedPassword, idRoles: role._id });
        await user.save();

        res.status(201).send(user);
    } catch (error) {
        res.status(500).send({ message: 'Erreur lors de l\'inscription', error });
    }
});

// Connexion d'un utilisateur
router.post('/login', async (req, res) => {
    const { mail, pwsd } = req.body;

    try {
        // Vérifiez si l'utilisateur existe
        const user = await User.findOne({ mail });
        if (!user) {
            return res.status(401).send('Email ou mot de passe incorrect');
        }

        // Vérifiez le mot de passe
        const isPasswordValid = await bcrypt.compare(pwsd, user.pwsd);
        if (!isPasswordValid) {
            return res.status(401).send('Email ou mot de passe incorrect');
        }

        // Créez un token JWT
        const accessToken = jwt.sign({ id: user._id }, SECRET_KEY, { expiresIn: '15m' });
        const refreshToken = jwt.sign({ id: user._id }, SECRET_KEY);

        // Renvoie le token et les informations utilisateur
        res.json({ accessToken, refreshToken, user: { mail: user.mail, idRoles: user.idRoles } });
    } catch (error) {
        res.status(500).send('Erreur lors de la connexion');
    }
});

// Rafraîchir le token
router.post('/token', refreshTokenMiddleware, (req, res) => {
    const accessToken = jwt.sign({ id: req.user._id }, SECRET_KEY, { expiresIn: '15m' });
    res.json({ accessToken });
});

// Déconnexion
router.delete('/logout', async (req, res) => {
    const { token } = req.body;
    await User.updateOne({ refreshToken: token }, { $set: { refreshToken: null } });
    res.sendStatus(204);
});

module.exports = router;