const express = require('express');
const router = express.Router();

const bookingController = require('../controllers/bookingController');
const authMiddleware = require('../middleware/auth');

router.post("/save", bookingController.savePassenger);
router.post("/reserve", bookingController.bookFlight);
router.get("/meals", bookingController.getMeals);
router.get("/:id/seats", bookingController.getSeats);
router.get("/:id/price", bookingController.getFlightPrice);
router.get('/:id', authMiddleware.isAuthenticated, authMiddleware.isPassenger, bookingController.showBookingPage);

module.exports = router;