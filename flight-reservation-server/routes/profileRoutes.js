const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');
const authMiddleware = require('../middleware/auth');

router.get('/', authMiddleware.isAuthenticated, authMiddleware.isCustomer, profileController.showProfilePage);

router.get('/edit', authMiddleware.isAuthenticated, authMiddleware.isCustomer, profileController.showEditProfilePage);
router.put('/update', authMiddleware.isAuthenticated, profileController.updateProfile);
router.post('/upload-picture', authMiddleware.isAuthenticated, profileController.uploadProfilePicture);
router.get('/data', authMiddleware.isAuthenticated, profileController.getProfileData);
router.get('/passengers', authMiddleware.isAuthenticated, profileController.getSavedPassengers);
router.get('/passengers/list', authMiddleware.isAuthenticated, profileController.getUserPassengers);
router.post('/passengers', authMiddleware.isAuthenticated, profileController.addSavedPassenger);
router.delete('/passengers/:id', authMiddleware.isAuthenticated, profileController.removeSavedPassenger);
router.get('/payment-methods', authMiddleware.isAuthenticated, profileController.getPaymentMethods);
router.post('/payment-methods', authMiddleware.isAuthenticated, profileController.addPaymentMethod);
router.delete('/payment-methods/:index', authMiddleware.isAuthenticated, profileController.removePaymentMethod);
router.put('/payment-methods/:index/default', authMiddleware.isAuthenticated, profileController.setDefaultPaymentMethod);
router.put('/notifications', authMiddleware.isAuthenticated, profileController.updateNotificationPreferences);

module.exports = router;