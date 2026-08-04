const express = require('express');
const router = express.Router();
const reservationController = require('../controllers/reservationController');

// ============================================================
// Page Routes
// ============================================================
router.get('/my-reservations', reservationController.showMyReservations);

// ============================================================
// AJAX Routes
// ============================================================
router.get('/:id/details', reservationController.getReservationDetails);
router.get('/:flightId/seats/:reservationId', reservationController.getAvailableSeats);
router.put('/:id/update-seat', reservationController.updateReservationSeat);
router.delete('/:id/cancel', reservationController.cancelReservation);
router.get('/count', reservationController.getReservationCount);

module.exports = router;