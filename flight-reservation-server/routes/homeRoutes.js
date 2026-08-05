const express = require('express');
const router = express.Router();

const homeController = require('../controllers/homeController');
const authMiddleware = require('../middleware/auth');

router.get('/', homeController.showHome);

module.exports = router;