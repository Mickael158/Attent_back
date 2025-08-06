const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const Video = require('../models/Video');
const refreshTokenMiddleware = require('../middleware/refreshTokenMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const router = express.Router();

// Configuration de multer pour le stockage des vidéos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'Uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('video/')) {
      return cb(new Error('Seuls les fichiers vidéo sont autorisés'), false);
    }
    // Liste des types MIME acceptés
    const allowedMimes = ['video/mp4', 'video/webm', 'video/ogg'];
    if (!allowedMimes.includes(file.mimetype)) {
      return cb(new Error('Format vidéo non supporté (MP4, WebM, Ogg uniquement)'), false);
    }
    cb(null, true);
  },
  limits: { fileSize: 100 * 1024 * 1024 }, // Limite à 100MB
});

// Route pour uploader une vidéo ou ajouter une URL
router.post('/videos', refreshTokenMiddleware, roleMiddleware(['admin']), upload.single('video'), async (req, res) => {
  const { title, url } = req.body;
  const videoUrl = req.file ? `/Uploads/${req.file.filename}` : url;

  try {
    if (!title || !videoUrl) {
      return res.status(400).json({ message: 'Le titre et l\'URL ou le fichier vidéo sont requis.' });
    }
    const video = new Video({ title, url: videoUrl });
    const createdVideo = await video.save();
    res.status(201).json({ video: createdVideo, message: 'Vidéo ajoutée avec succès.' });
  } catch (error) {
    console.error('Erreur lors de l\'ajout de la vidéo:', error);
    res.status(500).json({ message: error.message });
  }
});

// Route pour récupérer une vidéo par ID
router.get('/video/:id', refreshTokenMiddleware, roleMiddleware(['admin']), async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) {
      return res.status(404).json({ message: 'Vidéo non trouvée.' });
    }
    res.json(video);
  } catch (error) {
    console.error('Erreur lors de la récupération de la vidéo:', error);
    res.status(500).json({ message: error.message });
  }
});

// Route pour récupérer toutes les vidéos
router.get('/videos', refreshTokenMiddleware, roleMiddleware(['admin', 'affichage']), async (req, res) => {
  try {
    const videos = await Video.find();
    res.json(videos);
  } catch (error) {
    console.error('Erreur lors de la récupération des vidéos:', error);
    res.status(500).json({ message: error.message });
  }
});

// Route pour supprimer une vidéo par ID
router.delete('/videos/:id', refreshTokenMiddleware, roleMiddleware(['admin']), async (req, res) => {
  try {
    const deletedVideo = await Video.findByIdAndDelete(req.params.id);
    if (!deletedVideo) {
      return res.status(404).json({ message: 'Vidéo non trouvée.' });
    }
    // Supprimer le fichier physique si c'est une vidéo locale
    if (deletedVideo.url.startsWith('/Uploads/')) {
      const filePath = path.join(__dirname, '..', deletedVideo.url);
      await fs.unlink(filePath).catch(err => console.error('Erreur lors de la suppression du fichier:', err));
    }
    res.json({ message: 'Vidéo supprimée avec succès.' });
  } catch (error) {
    console.error('Erreur lors de la suppression de la vidéo:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;