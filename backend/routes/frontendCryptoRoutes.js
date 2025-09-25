const express = require('express');
const router = express.Router();
const {
  getAllCryptoList,
  getCryptoGraphData,
  getCryptoDetailsDatabase,
  getAllCryptosForCache,
  getCryptoIndicatorGraph,
} = require('../controllers/frontendCryptoController');

router.get('/cryptos', getAllCryptoList);

router.get('/:id/graph-details', getCryptoGraphData);

router.get('/cryptos-fetch-details', getCryptoDetailsDatabase);

router.get('/cryptos-cache-update', getAllCryptosForCache);

router.get('/:id/indicator-graph/rsi', getCryptoIndicatorGraph);

module.exports = router;
 