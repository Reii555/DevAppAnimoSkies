const express = require('express');
const router = express.Router();
const reservationController = require('../controllers/reservationController');
const Seat = require('../models/Seat');
const authMiddleware = require('../middleware/auth');

// ============================================================
// PAGE ROUTES
// ============================================================

router.get('/', authMiddleware.isAuthenticated, reservationController.showMyReservations);

// ============================================================
// AJAX FUNCTIONALITY
// ============================================================

router.get('/details/:id', reservationController.getReservationDetails);
router.get('/seats/:flightId/:reservationId?', authMiddleware.isAuthenticated, reservationController.getAvailableSeats);
router.get('/count', authMiddleware.isAuthenticated, reservationController.getReservationCount);
router.put('/:id/seat', authMiddleware.isAuthenticated, reservationController.updateReservationSeat);
router.patch('/:id/cancel', authMiddleware.isAuthenticated, reservationController.cancelReservation);

module.exports = router;