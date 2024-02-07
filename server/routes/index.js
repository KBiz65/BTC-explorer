const express = require('express');
const router = express.Router();

// Importing your route modules
const searchRoutes = require('./search');
const addressesRoutes = require('./addresses');
const blocksRoutes = require('./blocks');
const networkRoutes = require('./network');
const transactionsRoutes = require('./transactions');

// Use the imported routes
router.use('/search', searchRoutes);
router.use('/addresses', addressesRoutes);
router.use('/blocks', blocksRoutes);
router.use('/network', networkRoutes);
router.use('/transactions', transactionsRoutes);

// Export the consolidated router
module.exports = router;
