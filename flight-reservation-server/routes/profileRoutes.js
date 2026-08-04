const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');
const authMiddleware = require('../middleware/auth');

// For authentication
router.use(authMiddleware.isAuthenticated);

// Page routes
router.get('/', profileController.showProfilePage);
router.get('/edit', profileController.showEditProfilePage);

// API routes
router.put('/update', profileController.updateProfile);
router.post('/upload-picture', profileController.uploadProfilePicture);
router.get('/data', profileController.getProfileData);

// Passengers routes
router.get('/passengers', profileController.getSavedPassengers);
router.get('/passengers/list', profileController.getUserPassengers); 
router.post('/passengers', profileController.addSavedPassenger);
router.delete('/passengers/:id', profileController.removeSavedPassenger);

// Payment methods routes
router.get('/payment-methods', profileController.getPaymentMethods);
router.post('/payment-methods', profileController.addPaymentMethod);
router.delete('/payment-methods/:index', profileController.removePaymentMethod);
router.put('/payment-methods/:index/default', profileController.setDefaultPaymentMethod);

// Notification preferences
router.put('/notifications', profileController.updateNotificationPreferences);

module.exports = router;