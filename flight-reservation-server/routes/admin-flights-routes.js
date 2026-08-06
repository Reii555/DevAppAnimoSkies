const express = require("express");
const router = express.Router();

const adminFlightsController = require("../controllers/flightsController");
const authMiddleware = require("../middleware/auth");

router.get("/", authMiddleware.isAuthenticated, authMiddleware.isAdmin, adminFlightsController.renderFlights);
router.get("/data", authMiddleware.isAuthenticated, authMiddleware.isAdmin, adminFlightsController.getFlightData);
router.get("/search", authMiddleware.isAuthenticated, authMiddleware.isAdmin, adminFlightsController.searchFlights);
router.get("/check-flight-number", authMiddleware.isAuthenticated, authMiddleware.isAdmin, adminFlightsController.checkFlightNumber);
router.post("/", authMiddleware.isAuthenticated, authMiddleware.isAdmin, adminFlightsController.addFlight);
router.put("/:id", authMiddleware.isAuthenticated, authMiddleware.isAdmin, adminFlightsController.updateFlight);
router.delete("/:id", authMiddleware.isAuthenticated, authMiddleware.isAdmin, adminFlightsController.deleteFlight);

module.exports = router;