const jwt = require('jsonwebtoken');

// Vérifie que l'utilisateur est connecté
exports.authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token manquant ou invalide.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Ajoute l'utilisateur décodé à la requête
    next(); // Passe à la route suivante
  } catch (error) {
    return res.status(401).json({ error: 'Token invalide ou expiré.' });
  }
};

// Vérifie que l'utilisateur a un rôle spécifique
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Non authentifié.' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Accès refusé. Rôle insuffisant.' });
    }
    next();
  };
};