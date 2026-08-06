const express = require('express');
const router = express.Router();

const adminReservationController = require('../controllers/adminReservationController');
const authMiddleware = require('../middleware/auth');

router.get('/', 
authMiddleware.isAuthenticated, 
    authMiddleware.isAdmin, 
    adminReservationController.renderPage
);

router.get('/api', 
    authMiddleware.isAuthenticated, 
    authMiddleware.isAdmin, 
    adminReservationController.getReservations
);

router.put('/:id/status', 
    authMiddleware.isAuthenticated, 
    authMiddleware.isAdmin, 
    adminReservationController.updateStatus
);

module.exports = router;