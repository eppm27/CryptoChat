const express = require('express');
const router = express.Router();
const newsController = require('../controllers/newsController');

// News Routes
router.get('/', newsController.getLatestNews);
router.get('/:ticker', newsController.getNewsByTicker);

module.exports = router;
