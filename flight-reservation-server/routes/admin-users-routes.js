// routes/admin-users-routes.js
const express = require('express');
const router = express.Router();
const User = require("../models/User");
const adminUsersController = require('../controllers/adminUsersController');
const authMiddleware = require('../middleware/auth');

router.get('/', authMiddleware.isAuthenticated, authMiddleware.isAdmin, adminUsersController.renderPage);
router.get('/api', authMiddleware.isAuthenticated, authMiddleware.isAdmin, adminUsersController.getUsers);

module.exports = router;