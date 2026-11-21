const express = require('express');
const router = express.Router();
const terrainController = require('../controllers/terrainController');
const { authenticate, authorize } = require('../middlewares/authMiddleware');

// Routes publiques
router.get('/', terrainController.getAllTerrains);
router.get('/:id', terrainController.getTerrainById);

// Routes protégées (owner ou admin)
router.post('/', authenticate, authorize('owner', 'admin'), terrainController.createTerrain);
router.put('/:id', authenticate, authorize('owner', 'admin'), terrainController.updateTerrain);
router.delete('/:id', authenticate, authorize('owner', 'admin'), terrainController.deleteTerrain);

module.exports = router;