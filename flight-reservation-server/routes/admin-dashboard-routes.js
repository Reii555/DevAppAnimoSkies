const express = require("express");
const router = express.Router();

const adminDashboardController = require("../controllers/adminDashboardController"); 
const authMiddleware = require("../middleware/auth");

router.get("/", authMiddleware.isAuthenticated, authMiddleware.isAdmin, adminDashboardController.renderDashboard);
// revenue
router.get("/revenue", authMiddleware.isAuthenticated, authMiddleware.isAdmin, adminDashboardController.getRevenueData);

module.exports = router;