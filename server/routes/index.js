const express = require('express');
const router = express.Router();

// Importing your route modules
const addressesRoutes = require('./addresses');
const blocksRoutes = require('./blocks');
const transactionsRoutes = require('./transactions');

// Use the imported routes
router.use('/addresses', addressesRoutes);
router.use('/blocks', blocksRoutes);
router.use('/transactions', transactionsRoutes);

// Export the consolidated router
module.exports = router;
