const express = require('express');
const router = express.Router();
const reservationController = require('../controllers/reservationController');
const authMiddleware = require('../middleware/auth');

// For authentication
router.use(authMiddleware.isAuthenticated);

// Page routes
router.get('/', reservationController.showMyReservations);

router.get('/:id/details', reservationController.getReservationDetails);
router.get('/:flightId/seats', reservationController.getSeatMap);
router.put('/:id', reservationController.updateReservation);
router.delete('/:id/cancel', reservationController.cancelReservation);
router.get('/count', reservationController.getReservationCount);

module.exports = router;