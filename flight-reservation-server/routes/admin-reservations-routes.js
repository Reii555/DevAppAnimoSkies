const express = require('express');
const router = express.Router();
const adminReservationController = require('../controllers/adminReservationController');
const authMiddleware = require('../middleware/auth');

<<<<<<< HEAD
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
=======
router.get('/', authMiddleware.isAuthenticated, authMiddleware.isAdmin, adminReservationController.renderPage);
router.get('/api', authMiddleware.isAuthenticated, authMiddleware.isAdmin, adminReservationController.getReservations);
router.put('/:id/status', authMiddleware.isAuthenticated, authMiddleware.isAdmin, adminReservationController.updateStatus);
>>>>>>> 202697c140a1bfba50e61d5e7ea12bbb3c4b0eb1

module.exports = router;