const express = require('express');
const router = express.Router();
const reservationController = require('../controllers/reservationController');
const { authenticate, authorize } = require('../middlewares/authMiddleware');

// Toutes les routes de réservation nécessitent une authentification
router.use(authenticate);

// Client
router.post('/', authorize('client'), reservationController.createReservation);
router.get('/my', reservationController.getMyReservations);

// Owner
router.get('/owner', authorize('owner', 'admin'), reservationController.getOwnerReservations);
router.patch('/:id/confirm', authorize('owner', 'admin'), reservationController.confirmReservation);
router.patch('/:id/reject', authorize('owner', 'admin'), reservationController.rejectReservation);

// Client ou Owner
router.patch('/:id/cancel', reservationController.cancelReservation);

module.exports = router;