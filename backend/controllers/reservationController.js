const db = require('../db/database');

// POST /api/reservations (Client uniquement)
// Crée une demande de réservation
exports.createReservation = (req, res) => {
  try {
    const { terrain_id, date, start_time } = req.body;
    const client_id = req.user.id;

    if (!terrain_id || !date || !start_time) {
      return res.status(400).json({ error: 'terrain_id, date et start_time sont requis.' });
    }

    // 1. Vérifier que le terrain existe et est approuvé
    const terrain = db.prepare('SELECT * FROM terrains WHERE id = ? AND status = ?').get(terrain_id, 'approved');
    if (!terrain) {
      return res.status(404).json({ error: 'Terrain non trouvé ou non disponible.' });
    }

    // 2. Calculer l'heure de fin (start_time + 2 heures)
    const [hours, minutes] = start_time.split(':').map(Number);
    const endMinutes = hours * 60 + minutes + 120;
    const endHours = Math.floor(endMinutes / 60);
    const endMins = endMinutes % 60;
    const end_time = `${String(endHours).padStart(2, '0')}:${String(endMins).padStart(2, '0')}`;

    // 3. Vérifier si le créneau est déjà pris (protection contre les doubles réservations)
    const existingReservation = db.prepare(`
      SELECT * FROM reservations
      WHERE terrain_id = ? AND date = ? AND start_time = ? AND status IN ('pending', 'confirmed')
    `).get(terrain_id, date, start_time);

    if (existingReservation) {
      return res.status(409).json({ error: 'Ce créneau est déjà réservé ou en attente.' });
    }

    // 4. Vérifier que le créneau n'est pas bloqué par le propriétaire
    const blockedSlot = db.prepare(`
      SELECT * FROM blocked_slots
      WHERE terrain_id = ? AND date = ? AND start_time = ? AND end_time = ?
    `).get(terrain_id, date, start_time, end_time);

    if (blockedSlot) {
      return res.status(409).json({ error: 'Ce créneau est bloqué par le propriétaire.' });
    }

    // 5. Créer la réservation en statut 'pending'
    const result = db.prepare(`
      INSERT INTO reservations (client_id, terrain_id, date, start_time, end_time, status)
      VALUES (?, ?, ?, ?, ?, 'pending')
    `).run(client_id, terrain_id, date, start_time, end_time);

    const newReservation = db.prepare('SELECT * FROM reservations WHERE id = ?').get(result.lastInsertRowid);

    res.status(201).json({
      message: 'Demande de réservation créée. En attente de confirmation du propriétaire.',
      reservation: newReservation
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur lors de la création de la réservation.' });
  }
};

// GET /api/reservations/my (Client)
// Liste les réservations du client connecté
exports.getMyReservations = (req, res) => {
  try {
    const reservations = db.prepare(`
      SELECT r.*, t.name as terrain_name, t.location as terrain_location
      FROM reservations r
      JOIN terrains t ON r.terrain_id = t.id
      WHERE r.client_id = ?
      ORDER BY r.date DESC, r.start_time DESC
    `).all(req.user.id);

    res.json(reservations);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
};

// GET /api/reservations/owner (Owner)
// Liste les réservations des terrains du propriétaire connecté
exports.getOwnerReservations = (req, res) => {
  try {
    const reservations = db.prepare(`
      SELECT r.*, t.name as terrain_name, u.name as client_name, u.phone as client_phone
      FROM reservations r
      JOIN terrains t ON r.terrain_id = t.id
      JOIN users u ON r.client_id = u.id
      WHERE t.owner_id = ?
      ORDER BY r.date DESC, r.start_time DESC
    `).all(req.user.id);

    res.json(reservations);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
};

// PATCH /api/reservations/:id/confirm (Owner)
exports.confirmReservation = (req, res) => {
  try {
    const { id } = req.params;

    // Vérifier que la réservation appartient à un terrain du propriétaire
    const reservation = db.prepare(`
      SELECT r.*, t.owner_id
      FROM reservations r
      JOIN terrains t ON r.terrain_id = t.id
      WHERE r.id = ?
    `).get(id);

    if (!reservation) return res.status(404).json({ error: 'Réservation non trouvée.' });
    if (reservation.owner_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Vous n\'êtes pas autorisé à confirmer cette réservation.' });
    }
    if (reservation.status !== 'pending') {
      return res.status(400).json({ error: 'Seules les réservations en attente peuvent être confirmées.' });
    }

    db.prepare('UPDATE reservations SET status = ? WHERE id = ?').run('confirmed', id);

    res.json({ message: 'Réservation confirmée.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
};

// PATCH /api/reservations/:id/reject (Owner)
exports.rejectReservation = (req, res) => {
  try {
    const { id } = req.params;

    const reservation = db.prepare(`
      SELECT r.*, t.owner_id
      FROM reservations r
      JOIN terrains t ON r.terrain_id = t.id
      WHERE r.id = ?
    `).get(id);

    if (!reservation) return res.status(404).json({ error: 'Réservation non trouvée.' });
    if (reservation.owner_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Vous n\'êtes pas autorisé à refuser cette réservation.' });
    }
    if (reservation.status !== 'pending') {
      return res.status(400).json({ error: 'Seules les réservations en attente peuvent être refusées.' });
    }

    db.prepare('UPDATE reservations SET status = ? WHERE id = ?').run('rejected', id);

    res.json({ message: 'Réservation refusée.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
};

// PATCH /api/reservations/:id/cancel (Client ou Owner)
exports.cancelReservation = (req, res) => {
  try {
    const { id } = req.params;

    const reservation = db.prepare(`
      SELECT r.*, t.owner_id
      FROM reservations r
      JOIN terrains t ON r.terrain_id = t.id
      WHERE r.id = ?
    `).get(id);

    if (!reservation) return res.status(404).json({ error: 'Réservation non trouvée.' });

    // Autoriser le client qui a fait la réservation OU le propriétaire du terrain
    if (reservation.client_id !== req.user.id && reservation.owner_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Vous n\'êtes pas autorisé à annuler cette réservation.' });
    }

    // On ne peut annuler que si le statut est pending ou confirmed
    if (!['pending', 'confirmed'].includes(reservation.status)) {
      return res.status(400).json({ error: 'Cette réservation ne peut plus être annulée.' });
    }

    db.prepare('UPDATE reservations SET status = ? WHERE id = ?').run('cancelled', id);

    res.json({ message: 'Réservation annulée.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
};