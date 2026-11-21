const db = require('../db/database');

// --- FONCTION UTILITAIRE ---
// Convertit "HH:MM" en minutes depuis minuit (ex: "08:30" -> 510)
function timeToMinutes(timeStr) {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

// Convertit des minutes en "HH:MM" (ex: 510 -> "08:30")
function minutesToTime(totalMinutes) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

// --- ROUTES ---

// POST /api/terrains/:id/schedules (Owner uniquement)
// Définit les horaires d'ouverture d'un terrain pour un jour de la semaine
exports.setSchedule = (req, res) => {
  try {
    const { id } = req.params;
    const { day_of_week, open_time, close_time } = req.body;

    if (day_of_week === undefined || !open_time || !close_time) {
      return res.status(400).json({ error: 'day_of_week, open_time et close_time sont requis.' });
    }

    // Vérifier que le terrain appartient au propriétaire
    const terrain = db.prepare('SELECT * FROM terrains WHERE id = ?').get(id);
    if (!terrain) return res.status(404).json({ error: 'Terrain non trouvé.' });
    if (terrain.owner_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Vous ne pouvez modifier que vos propres terrains.' });
    }

    // Supprimer l'ancien horaire pour ce jour s'il existe
    db.prepare('DELETE FROM schedules WHERE terrain_id = ? AND day_of_week = ?').run(id, day_of_week);

    // Insérer le nouvel horaire
    db.prepare(`
      INSERT INTO schedules (terrain_id, day_of_week, open_time, close_time)
      VALUES (?, ?, ?, ?)
    `).run(id, day_of_week, open_time, close_time);

    res.json({ message: 'Horaire mis à jour avec succès.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
};

// GET /api/terrains/:id/slots?date=YYYY-MM-DD (Public)
// Calcule les créneaux disponibles de 2h pour une date donnée
exports.getAvailableSlots = (req, res) => {
  try {
    const { id } = req.params;
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({ error: 'Le paramètre date est requis (format YYYY-MM-DD).' });
    }

    // Vérifier que le terrain existe et est approuvé
    const terrain = db.prepare('SELECT * FROM terrains WHERE id = ? AND status = ?').get(id, 'approved');
    if (!terrain) return res.status(404).json({ error: 'Terrain non trouvé ou non disponible.' });

    // 1. Récupérer le jour de la semaine de la date (0 = dimanche, 1 = lundi...)
    const dayOfWeek = new Date(date).getDay();

    // 2. Récupérer l'horaire d'ouverture pour ce jour
    const schedule = db.prepare(`
      SELECT * FROM schedules WHERE terrain_id = ? AND day_of_week = ?
    `).get(id, dayOfWeek);

    if (!schedule) {
      return res.json({ date, slots: [], message: 'Le terrain est fermé ce jour-là.' });
    }

    // 3. Découper la journée en créneaux de 2 heures
    const openMinutes = timeToMinutes(schedule.open_time);
    const closeMinutes = timeToMinutes(schedule.close_time);
    const slots = [];

    for (let start = openMinutes; start + 120 <= closeMinutes; start += 120) {
      slots.push({
        start_time: minutesToTime(start),
        end_time: minutesToTime(start + 120)
      });
    }

    // 4. Récupérer les réservations existantes (pending ou confirmed) pour ce terrain à cette date
    const reservations = db.prepare(`
      SELECT start_time, end_time FROM reservations
      WHERE terrain_id = ? AND date = ? AND status IN ('pending', 'confirmed')
    `).all(id, date);

    // 5. Récupérer les créneaux bloqués par le propriétaire
    const blockedSlots = db.prepare(`
      SELECT start_time, end_time FROM blocked_slots
      WHERE terrain_id = ? AND date = ?
    `).all(id, date);

    // 6. Marquer les créneaux comme disponibles ou non
    const slotsWithStatus = slots.map(slot => {
      const isReserved = reservations.some(r => r.start_time === slot.start_time && r.end_time === slot.end_time);
      const isBlocked = blockedSlots.some(b => b.start_time === slot.start_time && b.end_time === slot.end_time);
      
      return {
        ...slot,
        available: !isReserved && !isBlocked
      };
    });

    res.json({ date, slots: slotsWithStatus });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
};