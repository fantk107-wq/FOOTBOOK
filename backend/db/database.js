const Database = require('better-sqlite3');
const path = require('path');

// Le fichier de base de données sera créé dans backend/db/footbook.sqlite
const dbPath = path.join(__dirname, 'footbook.sqlite');
const db = new Database(dbPath);

// Activer les clés étrangères (FOREIGN KEYS) - important pour les relations
db.pragma('foreign_keys = ON');

console.log('✅ Connexion à SQLite établie :', dbPath);

module.exports = db;