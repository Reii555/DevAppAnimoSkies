const express = require('express');
const router = express.Router();
const reservationController = require('../controllers/reservationController');
const authMiddleware = require('../middleware/auth');


router.get('/', authMiddleware.isAuthenticated, authMiddleware.isPassenger, reservationController.showMyReservations);

router.get('/details/:id', authMiddleware.isAuthenticated, reservationController.getReservationDetails);
router.get('/seats/:flightId/:reservationId', authMiddleware.isAuthenticated, reservationController.getSeatMap);
router.put('/:id', authMiddleware.isAuthenticated, reservationController.updateReservation);
router.patch('/:id/cancel', authMiddleware.isAuthenticated, reservationController.cancelReservation);
router.get('/count', authMiddleware.isAuthenticated, reservationController.getReservationCount);

module.exports = router;