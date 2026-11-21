const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db/database');

// Fonction pour générer un token JWT
function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' } // Le token expire après 7 jours
  );
}

// POST /api/auth/register
exports.register = (req, res) => {
  try {
    const { name, email, password, phone, role } = req.body;

    // Validation simple
    if (!name || !email || !password || !phone) {
      return res.status(400).json({ error: 'Tous les champs sont obligatoires.' });
    }

    // Vérifier que le rôle est valide
    const validRoles = ['client', 'owner'];
    if (role && !validRoles.includes(role)) {
      return res.status(400).json({ error: 'Rôle invalide. Choisissez client ou owner.' });
    }

    // Vérifier si l'email existe déjà
    const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existingUser) {
      return res.status(409).json({ error: 'Cet email est déjà utilisé.' });
    }

    // Hacher le mot de passe
    const hashedPassword = bcrypt.hashSync(password, 10);

    // Insérer l'utilisateur
    const result = db.prepare(`
      INSERT INTO users (name, email, password, phone, role)
      VALUES (?, ?, ?, ?, ?)
    `).run(name, email, hashedPassword, phone, role || 'client');

    // Récupérer l'utilisateur créé
    const newUser = db.prepare('SELECT id, name, email, phone, role FROM users WHERE id = ?').get(result.lastInsertRowid);

    // Générer un token
    const token = generateToken(newUser);

    res.status(201).json({
      message: 'Inscription réussie !',
      user: newUser,
      token
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur serveur lors de l\'inscription.' });
  }
};

// POST /api/auth/login
exports.login = (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email et mot de passe requis.' });
    }

    // Chercher l'utilisateur
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!user) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect.' });
    }

    // Vérifier le mot de passe
    const passwordMatch = bcrypt.compareSync(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect.' });
    }

    // Générer un token
    const token = generateToken(user);

    // Ne jamais renvoyer le mot de passe
    const { password: _, ...userWithoutPassword } = user;

    res.json({
      message: 'Connexion réussie !',
      user: userWithoutPassword,
      token
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur serveur lors de la connexion.' });
  }
};