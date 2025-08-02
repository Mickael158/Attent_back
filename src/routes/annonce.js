const express = require('express');
const Annonce = require('../models/Annonce'); 
const refreshTokenMiddleware = require('../middleware/refreshTokenMiddleware'); 
const roleMiddleware = require('../middleware/roleMiddleware'); 
const router = express.Router();

router.post('/annonce', refreshTokenMiddleware, roleMiddleware(['admin']), async (req, res) => {
    try {
        const annonce = new Annonce({
            texte: 'Bonjour' 
        });

        const createdAnnonce = await annonce.save(); 
        res.status(201).json(createdAnnonce); 
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.put('/annonce/:id', refreshTokenMiddleware, roleMiddleware(['admin']), async (req, res) => {
    const { texte } = req.body; 
    try {
        const updatedAnnonce = await Annonce.findByIdAndUpdate(
            req.params.id, 
            { texte }, 
            { new: true, runValidators: true } 
        );

        if (!updatedAnnonce) {
            return res.status(404).json({ message: 'Annonce non trouvée.' });
        }

        res.json(updatedAnnonce);                                                                                                                  
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.get('/annonces', refreshTokenMiddleware, roleMiddleware(['admin', 'affichage']), async (req, res) => {
    try {
        const annonces = await Annonce.find(); 
        res.json(annonces); 
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;