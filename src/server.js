// server.js (ou index.js)
require('dotenv').config(); // ← Chargement des variables d'environnement dès le début

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const path = require('path');

const connectDB = require('./config/db');
const roleRoutes = require('./routes/roles');
const userRoutes = require('./routes/users');
const authRoutes = require('./routes/auth');
const prestationRoutes = require('./routes/prestations');
const listeRoutes = require('./routes/liste');
const occupationRoutes = require('./routes/occupation');
const tacheRoutes = require('./routes/tache');
const placeRoutes = require('./routes/place');
const annonceRoutes = require('./routes/annonce');
const videoRoutes = require('./routes/video');
const appelRoutes = require('./routes/appel');

const app = express();
const PORT = process.env.PORT ;

// Récupération de l'URL frontend depuis le .env
const FRONTEND_URL = process.env.FRONTEND_URL;

// Option avancée : plusieurs origines (si tu utilises ALLOWED_ORIGINS)
let allowedOrigins = [FRONTEND_URL];

if (process.env.ALLOWED_ORIGINS) {
  allowedOrigins = process.env.ALLOWED_ORIGINS.split(',').map(url => url.trim());
}

const corsOptions = {
  origin: (origin, callback) => {
    // Autorise les requêtes sans origin (Postman, mobile, etc.)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Origine non autorisée par CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

connectDB();

app.use(cors(corsOptions));
app.use(bodyParser.json({ limit: '10mb' }));        // Augmenté pour les uploads
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

// Servir les fichiers statiques (vidéos, images…)
app.use('/Uploads', express.static(path.join(__dirname, 'Uploads'), {
  setHeaders: (res, filePath) => {
    if (path.extname(filePath).toLowerCase() === '.mp4') {
      res.setHeader('Content-Type', 'video/mp4');
    }
    // Tu peux ajouter d'autres types ici (webm, mov, etc.)
  }
}));

// Routes API
app.use('/api/roles', roleRoutes);
app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/prestations', prestationRoutes);
app.use('/api/liste', listeRoutes);
app.use('/api/occupation', occupationRoutes);
app.use('/api/tache', tacheRoutes);
app.use('/api/place', placeRoutes);
app.use('/api/annonce', annonceRoutes);
app.use('/api/video', videoRoutes);
app.use('/api/appel', appelRoutes);

// Route de test (optionnelle)
app.get('/', (req, res) => {
  res.json({ message: 'API en marche !' });
});

app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
  console.log(`CORS autorise : ${allowedOrigins.join(', ')}`);
});