const db = require('../db/database');

// GET /api/terrains (public : liste les terrains approuvés)
exports.getAllTerrains = (req, res) => {
  try {
    const terrains = db.prepare(`
      SELECT t.*, u.name as owner_name, u.phone as owner_phone
      FROM terrains t
      JOIN users u ON t.owner_id = u.id
      WHERE t.status = 'approved'
    `).all();
    res.json(terrains);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur lors de la récupération des terrains.' });
  }
};

// GET /api/terrains/:id (public : détail d'un terrain)
exports.getTerrainById = (req, res) => {
  try {
    const terrain = db.prepare(`
      SELECT t.*, u.name as owner_name, u.phone as owner_phone
      FROM terrains t
      JOIN users u ON t.owner_id = u.id
      WHERE t.id = ?
    `).get(req.params.id);

    if (!terrain) {
      return res.status(404).json({ error: 'Terrain non trouvé.' });
    }

    // Récupérer aussi les images
    const images = db.prepare('SELECT image_url FROM terrain_images WHERE terrain_id = ?').all(req.params.id);
    terrain.images = images.map(img => img.image_url);

    res.json(terrain);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
};

// POST /api/terrains (protégé : owner uniquement)
exports.createTerrain = (req, res) => {
  try {
    const { name, description, location, type, price_per_slot } = req.body;

    if (!name || !location || !type || !price_per_slot) {
      return res.status(400).json({ error: 'Nom, localisation, type et prix sont requis.' });
    }

    // Un owner crée un terrain en statut 'pending' (en attente de validation admin)
    const result = db.prepare(`
      INSERT INTO terrains (owner_id, name, description, location, type, price_per_slot, status)
      VALUES (?, ?, ?, ?, ?, ?, 'pending')
    `).run(req.user.id, name, description || '', location, type, price_per_slot);

    const newTerrain = db.prepare('SELECT * FROM terrains WHERE id = ?').get(result.lastInsertRowid);

    res.status(201).json({
      message: 'Terrain créé avec succès. En attente de validation par l\'administrateur.',
      terrain: newTerrain
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur lors de la création du terrain.' });
  }
};

// PUT /api/terrains/:id (protégé : owner du terrain uniquement)
exports.updateTerrain = (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, location, type, price_per_slot } = req.body;

    // Vérifier que le terrain existe et appartient à l'utilisateur
    const terrain = db.prepare('SELECT * FROM terrains WHERE id = ?').get(id);
    if (!terrain) {
      return res.status(404).json({ error: 'Terrain non trouvé.' });
    }
    if (terrain.owner_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Vous ne pouvez modifier que vos propres terrains.' });
    }

    db.prepare(`
      UPDATE terrains
      SET name = ?, description = ?, location = ?, type = ?, price_per_slot = ?
      WHERE id = ?
    `).run(name, description, location, type, price_per_slot, id);

    const updatedTerrain = db.prepare('SELECT * FROM terrains WHERE id = ?').get(id);

    res.json({ message: 'Terrain mis à jour.', terrain: updatedTerrain });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour.' });
  }
};

// DELETE /api/terrains/:id (protégé : owner du terrain ou admin)
exports.deleteTerrain = (req, res) => {
  try {
    const { id } = req.params;

    const terrain = db.prepare('SELECT * FROM terrains WHERE id = ?').get(id);
    if (!terrain) {
      return res.status(404).json({ error: 'Terrain non trouvé.' });
    }
    if (terrain.owner_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Vous ne pouvez supprimer que vos propres terrains.' });
    }

    // Suppression logique (on ne supprime pas la ligne, on la désactive)
    db.prepare(`UPDATE terrains SET status = 'disabled' WHERE id = ?`).run(id);

    res.json({ message: 'Terrain désactivé avec succès.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur lors de la suppression.' });
  }
};