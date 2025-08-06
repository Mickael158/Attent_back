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
const PORT = process.env.PORT || 4000;

// Connexion à la base de données
connectDB();

// Configuration CORS
const corsOptions = {
  origin: 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));
app.use(bodyParser.json());
app.use(cookieParser());

// Servir les fichiers statiques avec le bon type MIME
app.use('/Uploads', express.static('Uploads', {
  setHeaders: (res, filePath) => {
    if (path.extname(filePath) === '.mp4') {
      res.setHeader('Content-Type', 'video/mp4');
    }
  }
}));

// Routes
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

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});