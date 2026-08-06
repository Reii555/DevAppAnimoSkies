const express = require('express');
const router = express.Router();

const adminController = require('../controllers/adminDashboardController');
const authMiddleware = require('../middleware/auth');

router.get('/', authMiddleware.isAuthenticated, authMiddleware.isAdmin, adminController.viewAuditLogs);

module.exports = router;