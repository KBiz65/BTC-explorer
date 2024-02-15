require('dotenv').config();
const express = require('express');
const router = express.Router();
const pool = require('../database');

// GET Latest Blocks
router.get('/latest', async (req, res) => {
  try {
    // Query the database for block information
    const blocksQuery = `
      SELECT * FROM blocks
      ORDER BY height ASC
      OFFSET 100000
      LIMIT 10;
    `;
    const { rows: blocks } = await pool.query(blocksQuery);

    if (blocks.length === 0) {
      res.status(404).json({ error: 'No blocks found. Try again later.' });
      return;
    }

    res.json({ latestBlocks : blocks });
  } catch (error) {
    console.error('Error retrieving latest blocks:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET Block Info
router.get('/:blockHashOrHeight', async (req, res) => {
  const blockCriteria = req.params.blockHashOrHeight;
  console.log('blockCriteria: ', blockCriteria);

  try {
    // Query the database for block information
    const query = `
      SELECT * FROM blocks
      WHERE block_hash = $1 OR height = $2;
    `;
    const { rows } = await pool.query(query, [blockCriteria, blockCriteria]);

    if (rows.length === 0) {
      res.status(404).json({ error: 'Block not found' });
      return;
    }

    res.json({ blockInfo : rows[0] });
  } catch (error) {
    console.error('Error retrieving block info:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET Block Transactions
router.get('/:blockHash/transactions', async (req, res) => {
  const blockHash = req.params.blockHash;

  try {
    // Retrieve and return a list of transactions within the specified Bitcoin block
    // You can query the transactions associated with the block from the database
    // and send them as a JSON response.
  } catch (error) {
    console.error('Error retrieving block transactions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
