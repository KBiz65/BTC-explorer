require('dotenv').config();
const express = require('express');
const router = express.Router();
const pool = require('../database');
const bitcoinClient = require('../bitcoinClient');// Import bitcoinClient connection

// GET Latest Transactions
router.get('/latest', async (req, res) => {
  try {
    // Query the bitcoin blockchain for the latest unconfirmed transactions
    const transactionsResponse = await bitcoinClient.getRawMempool(true);
    
    // Convert transactionsResponse into an array, sort it, and take the first 2 transactions
    const sortedTransactions = Object.entries(transactionsResponse).sort((a, b) => b[1].time - a[1].time).slice(0, 10);

    const transactionsObjects = await Promise.all(
      sortedTransactions.map(async ([txid, txData]) => {
        // Await the call to getRawTransaction to get the transaction details
        const txDetails = await bitcoinClient.getRawTransaction(txid, true);

        // Calculate the sum of the output values
        const valueSum = txDetails.vout.reduce((sum, output) => sum + output.value, 0);

        return {
          txid,
          txData,
          valueSum,
        };
      })
    );

    if (transactionsObjects.length === 0) {
      res.status(404).json({ error: 'No transactions found. Try again later.' });
      return;
    }

    res.status(200).json({ latestTransactions: transactionsObjects });
  } catch (error) {
    console.error('Error retrieving latest transactions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET Transaction Info
router.get('/:transactionId', async (req, res) => {
	const transactionId = req.params.transactionId;

	try {
		// Query the database for transaction information
		const query = `
      SELECT * FROM transactions
      WHERE txid = $1;
    `;
		const { rows } = await pool.query(query, [transactionId]);

		if (rows.length === 0) {
			res.status(404).json({ error: 'Transaction not found' });
			return;
		}

		res.json({ transactionInfo: rows[0] });
	} catch (error) {
		console.error('Error retrieving transaction info:', error);
		res.status(500).json({ error: 'Internal server error' });
	}
});

module.exports = router;
