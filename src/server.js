const express = require('express');
const bodyParser = require('body-parser');
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
const PORT = process.env.PORT || 3000;

connectDB();

app.use(bodyParser.json());

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