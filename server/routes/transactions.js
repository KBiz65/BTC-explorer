require('dotenv').config();
const express = require('express');
const router = express.Router();
const { Pool } = require('pg'); // Import the Pool from pg for database connection

const databaseHost = process.env.DATABASE_HOST;
const databaseName = process.env.DATABASE_NAME;
const databaseUser = process.env.DATABASE_USER;
const databasePassword = process.env.DATABASE_PASSWORD;
const databasePort = process.env.DATABASE_PORT;

// Create a PostgreSQL connection pool
const pool = new Pool({
  host: databaseHost,
  database: databaseName, // Replace with your database name
  user: databaseUser,
  password: databasePassword,       // Replace with your database password
  port: databasePort,
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
