const db = require('./database');

// Supprimer les tables si elles existent (pour repartir proprement)
db.exec(`
  DROP TABLE IF EXISTS reservations;
  DROP TABLE IF EXISTS blocked_slots;
  DROP TABLE IF EXISTS schedules;
  DROP TABLE IF EXISTS terrain_images;
  DROP TABLE IF EXISTS terrains;
  DROP TABLE IF EXISTS users;
`);

// Créer les tables
db.exec(`
  -- TABLE USERS (clients, owners, admin)
  CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    phone TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('client', 'owner', 'admin')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- TABLE TERRAINS
  CREATE TABLE terrains (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    owner_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    location TEXT NOT NULL,
    type TEXT NOT NULL,
    price_per_slot REAL NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'disabled')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
  );

  -- TABLE TERRAIN IMAGES
  CREATE TABLE terrain_images (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    terrain_id INTEGER NOT NULL,
    image_url TEXT NOT NULL,
    FOREIGN KEY (terrain_id) REFERENCES terrains(id) ON DELETE CASCADE
  );

  -- TABLE SCHEDULES (horaires d'ouverture par jour)
  CREATE TABLE schedules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    terrain_id INTEGER NOT NULL,
    day_of_week INTEGER NOT NULL, -- 0 = dimanche, 1 = lundi, etc.
    open_time TEXT NOT NULL,      -- format 'HH:MM'
    close_time TEXT NOT NULL,     -- format 'HH:MM'
    FOREIGN KEY (terrain_id) REFERENCES terrains(id) ON DELETE CASCADE
  );

  -- TABLE BLOCKED SLOTS (créneaux bloqués par le propriétaire)
  CREATE TABLE blocked_slots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    terrain_id INTEGER NOT NULL,
    date TEXT NOT NULL,           -- format 'YYYY-MM-DD'
    start_time TEXT NOT NULL,     -- format 'HH:MM'
    end_time TEXT NOT NULL,       -- format 'HH:MM'
    FOREIGN KEY (terrain_id) REFERENCES terrains(id) ON DELETE CASCADE
  );

  -- TABLE RESERVATIONS
  CREATE TABLE reservations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id INTEGER NOT NULL,
    terrain_id INTEGER NOT NULL,
    date TEXT NOT NULL,           -- 'YYYY-MM-DD'
    start_time TEXT NOT NULL,     -- 'HH:MM'
    end_time TEXT NOT NULL,       -- 'HH:MM'
    status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'confirmed', 'rejected', 'cancelled', 'expired', 'completed')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (terrain_id) REFERENCES terrains(id) ON DELETE CASCADE
  );
`);

console.log('✅ Toutes les tables ont été créées avec succès !');