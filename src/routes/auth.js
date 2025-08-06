const express = require('express');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const roleMiddleware = require('../middleware/roleMiddleware');
const router = express.Router();
const { SECRET_KEY } = require('../config/config');
const Role = require('../models/Role');

router.post('/register', async (req, res) => {
    const { mail, pwsd, nomRole } = req.body;

    // Validation des données d'entrée
    if (!mail || !pwsd || !nomRole) {
        return res.status(400).json({ message: 'Email, mot de passe et rôle sont requis' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail)) {
        return res.status(400).json({ message: 'Format d\'email invalide' });
    }
    if (pwsd.length < 6) {
        return res.status(400).json({ message: 'Le mot de passe doit contenir au moins 6 caractères' });
    }
    // if (nomRole !== 'box' && nomRole !== 'bio') {
    //     return res.status(400).json({ message: 'L\'inscription est uniquement autorisée pour le rôle box' });
    // }

    try {
        const existingUser = await User.findOne({ mail });
        if (existingUser) {
            return res.status(400).json({ message: 'Cet email est déjà utilisé' });
        }

        const role = await Role.findOne({ nom: nomRole });
        if (!role) {
            return res.status(400).json({ message: 'Rôle non trouvé' });
        }

        const hashedPassword = await bcrypt.hash(pwsd, 10);
        const user = new User({
            mail,
            pwsd: hashedPassword,
            idRoles: role._id,
            isValidated: false
        });
        await user.save();

        res.status(201).json({ message: 'Inscription réussie. En attente de validation par un administrateur' });
    } catch (error) {
        console.error('Erreur lors de l\'inscription :', error);
        res.status(500).json({ message: 'Erreur serveur lors de l\'inscription' });
    }
});

router.post('/login', async (req, res) => {
    const { mail, pwsd } = req.body;

    // Validation des données d'entrée
    if (!mail || !pwsd) {
        return res.status(400).json({ message: 'Email et mot de passe sont requis' });
    }

    try {
        const user = await User.findOne({ mail }).populate('idRoles');
        if (!user) {
            return res.status(401).json({ message: 'Email incorrect' });
        }

        if (!user.idRoles) {
            return res.status(500).json({ message: 'Erreur interne : rôle non associé à l\'utilisateur' });
        }

        if (!user.isValidated) {
            return res.status(401).json({ message: 'Compte en attente de validation par un administrateur' });
        }

        const isPasswordValid = await bcrypt.compare(pwsd, user.pwsd);
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Mot de passe incorrect' });
        }

        const accessToken = jwt.sign({ id: user._id, role: user.idRoles.nom }, SECRET_KEY, { expiresIn: '1m' });
        const refreshToken = jwt.sign({ id: user._id, role: user.idRoles.nom }, SECRET_KEY, { expiresIn: '7d' });
        user.refreshToken = refreshToken;
        await user.save();

        res
            .cookie('refreshToken', refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 7 * 24 * 60 * 60 * 1000 // 7 jours
            })
            .json({ accessToken, user: { mail: user.mail, role: user.idRoles.nom, isValidated: user.isValidated } });
    } catch (error) {
        console.error('Erreur de connexion :', error);
        res.status(500).json({ message: 'Erreur serveur lors de la connexion' });
    }
});

router.post('/token', async (req, res) => {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
        return res.status(401).json({ message: 'Aucun refresh token fourni' });
    }

    try {
        const user = await User.findOne({ refreshToken }).populate('idRoles');
        if (!user || !user.idRoles) {
            return res.status(403).json({ message: 'Refresh token invalide' });
        }

        if (!user.isValidated) {
            return res.status(403).json({ message: 'Compte en attente de validation par un administrateur' });
        }

        jwt.verify(refreshToken, SECRET_KEY, (err, decoded) => {
            if (err) {
                return res.status(403).json({ message: 'Refresh token invalide ou expiré' });
            }
            const accessToken = jwt.sign({ id: user._id, role: user.idRoles.nom }, SECRET_KEY, { expiresIn: '1m' });
            res.json({ accessToken });
        });
    } catch (error) {
        console.error('Erreur lors du rafraîchissement du token :', error);
        res.status(500).json({ message: 'Erreur serveur lors du rafraîchissement du token' });
    }
});

router.delete('/logout', async (req, res) => {
    try {
        const refreshToken = req.cookies.refreshToken;
        if (refreshToken) {
            await User.updateOne({ refreshToken }, { $set: { refreshToken: null } });
        }
        res.clearCookie('refreshToken', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict'
        });
        res.status(204).json({ message: 'Déconnexion réussie' });
    } catch (error) {
        console.error('Erreur lors de la déconnexion :', error);
        res.status(500).json({ message: 'Erreur serveur lors de la déconnexion' });
    }
});

router.get('/users/pending', roleMiddleware(['admin']), async (req, res) => {
    try {
        const pendingUsers = await User.find({ isValidated: false, 'idRoles.nom': 'box' })
            .populate('idRoles')
            .select('mail idRoles isValidated');
        res.json(pendingUsers);
    } catch (error) {
        console.error('Erreur lors de la récupération des utilisateurs en attente :', error);
        res.status(500).json({ message: 'Erreur serveur lors de la récupération des utilisateurs en attente' });
    }
});

router.put('/users/validate/:id', roleMiddleware(['admin']), async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({ message: 'ID d\'utilisateur invalide' });
        }

        const user = await User.findById(req.params.id).populate('idRoles');
        if (!user) {
            return res.status(404).json({ message: 'Utilisateur non trouvé' });
        }

        if (!user.idRoles || user.idRoles.nom !== 'box') {
            return res.status(400).json({ message: 'Seuls les utilisateurs avec le rôle box peuvent être validés' });
        }

        if (user.isValidated) {
            return res.status(400).json({ message: 'Utilisateur déjà validé' });
        }

        user.isValidated = true;
        await user.save();
        res.json({ message: 'Utilisateur validé avec succès' });
    } catch (error) {
        console.error('Erreur lors de la validation de l\'utilisateur :', error);
        res.status(500).json({ message: 'Erreur serveur lors de la validation de l\'utilisateur' });
    }
});

module.exports = router;