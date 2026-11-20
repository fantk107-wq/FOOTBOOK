const db = require('./database');

console.log('🌱 Insertion des données de test...');

// 1. Créer un admin
db.prepare(`
  INSERT INTO users (name, email, password, phone, role)
  VALUES (?, ?, ?, ?, ?)
`).run('Admin FootBook', 'admin@footbook.mg', 'admin123', '+261340000000', 'admin');

// 2. Créer un propriétaire
db.prepare(`
  INSERT INTO users (name, email, password, phone, role)
  VALUES (?, ?, ?, ?, ?)
`).run('Rakoto Propriétaire', 'rakoto@footbook.mg', 'owner123', '+261341111111', 'owner');

// 3. Créer un client
db.prepare(`
  INSERT INTO users (name, email, password, phone, role)
  VALUES (?, ?, ?, ?, ?)
`).run('Rabe Client', 'rabe@footbook.mg', 'client123', '+261342222222', 'client');

// 4. Créer un terrain pour le propriétaire (ID 2)
db.prepare(`
  INSERT INTO terrains (owner_id, name, description, location, type, price_per_slot, status)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`).run(
  2,
  'Terrain Itaosy Elite',
  'Un beau terrain synthétique avec éclairage pour jouer le soir.',
  'Itaosy, Antananarivo',
  '5 contre 5',
  60000,
  'approved'
);

// 5. Créer un deuxième terrain
db.prepare(`
  INSERT INTO terrains (owner_id, name, description, location, type, price_per_slot, status)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`).run(
  2,
  'Terrain Ankadifotsy Pro',
  'Terrain en gazon naturel, idéal pour les matchs 7 contre 7.',
  'Ankadifotsy, Antananarivo',
  '7 contre 7',
  120000,
  'pending'
);

// 6. Ajouter un horaire d'ouverture pour le terrain 1 (tous les jours 8h-22h)
for (let day = 0; day <= 6; day++) {
  db.prepare(`
    INSERT INTO schedules (terrain_id, day_of_week, open_time, close_time)
    VALUES (?, ?, ?, ?)
  `).run(1, day, '08:00', '22:00');
}

console.log('✅ Données de test insérées avec succès !');