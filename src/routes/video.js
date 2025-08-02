const express = require('express');
const multer = require('multer');
const Video = require('../models/Video'); // Modèle Video
const refreshTokenMiddleware = require('../middleware/refreshTokenMiddleware'); // Middleware pour le token
const roleMiddleware = require('../middleware/roleMiddleware'); // Middleware pour le contrôle des rôles
const router = express.Router();

// Configuration de multer pour le stockage des vidéos
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); // Répertoire où les vidéos seront stockées
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname); // Nomme le fichier avec un timestamp
    }
});

const upload = multer({ storage });
  
// Route pour uploader une vidéo
router.post('/video', refreshTokenMiddleware, roleMiddleware(['admin']), upload.single('video'), async (req, res) => {
    const { title } = req.body; 
    const url = req.file.path; 

    try {
        const video = new Video({
            title,
            url
        });

        const createdVideo = await video.save(); // Sauvegarde la vidéo
        res.status(201).json(createdVideo); // Renvoie la vidéo créée
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Route pour sélectionner une vidéo par ID
router.get('/video/:id', refreshTokenMiddleware, async (req, res) => {
    try {
        const video = await Video.findById(req.params.id); // Recherche la vidéo par ID

        if (!video) {
            return res.status(404).json({ message: 'Vidéo non trouvée.' });
        }

        res.json(video); // Renvoie la vidéo trouvée
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Route pour récupérer toutes les vidéos
router.get('/videos', refreshTokenMiddleware, async (req, res) => {
    try {
        const videos = await Video.find(); // Récupère toutes les vidéos
        res.json(videos); // Renvoie la liste des vidéos
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Route pour supprimer une vidéo par ID
router.delete('/video/:id', refreshTokenMiddleware, roleMiddleware(['admin']), async (req, res) => {
    try {
        const deletedVideo = await Video.findByIdAndDelete(req.params.id); // Supprime la vidéo par ID

        if (!deletedVideo) {
            return res.status(404).json({ message: 'Vidéo non trouvée.' });
        }

        res.json({ message: 'Vidéo supprimée avec succès.' }); // Confirmation de la suppression
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;