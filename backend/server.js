// 1. Importation des bibliothèques
const express = require('express');
const cors = require('cors');
require('dotenv').config();

// 2. Création de l'application Express
const app = express();

// 3. Middlewares (fonctions qui s'exécutent avant chaque route)
app.use(cors()); // Autorise les requêtes depuis d'autres origines (mobile, navigateur)
app.use(express.json()); // Permet de lire le corps des requêtes au format JSON

// 4. Définition du port d'écoute
const PORT = process.env.PORT || 3000;

// 5. Première route de test
app.get('/', (req, res) => {
  res.json({ message: 'Bienvenue sur l\'API FootBook !' });
});

// --- Importation et branchement des routes ---
const authRoutes = require('./routes/authRoutes');
app.use('/api/auth', authRoutes);

// 6. Démarrage du serveur
app.listen(PORT, () => {
  console.log(`🚀 Serveur FootBook démarré sur http://localhost:${PORT}`);
});