const express = require('express');
const router = express.Router();

const searchController = require('../controllers/searchController');
const authMiddleware = require('../middleware/auth');

router.get('/', authMiddleware.isAuthenticated, authMiddleware.isPassenger, searchController.showSearchPage);
router.post('/', searchController.showFlights);

module.exports = router;