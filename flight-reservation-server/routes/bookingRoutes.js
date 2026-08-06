const express = require('express');
const router = express.Router();

const bookingController = require('../controllers/bookingController');
const authMiddleware = require('../middleware/auth');

router.post("/save", authMiddleware.isAuthenticated, authMiddleware.isPassenger, bookingController.savePassenger);
router.post("/reserve", authMiddleware.isAuthenticated, authMiddleware.isPassenger, bookingController.bookFlight);
router.get("/meals", authMiddleware.isAuthenticated, authMiddleware.isPassenger, bookingController.getMeals);
router.get("/:id/seats", authMiddleware.isAuthenticated, authMiddleware.isPassenger, bookingController.getSeats);
router.get("/:id/price", authMiddleware.isAuthenticated, authMiddleware.isPassenger, bookingController.getFlightPrice);
router.get('/:id', authMiddleware.isAuthenticated, authMiddleware.isPassenger, bookingController.showBookingPage);

module.exports = router;