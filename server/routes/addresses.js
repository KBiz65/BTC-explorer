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

// GET Address Info
router.get('/:address', async (req, res) => {
  const address = req.params.address;
  console.log('query: ', req.query);

  try {
    // Query the database for address information
    const query = `
      SELECT * FROM outputs
      WHERE address = $1;
    `;
    const { rows } = await pool.query(query, [address]);

    if (rows.length === 0) {
      res.status(404).json({ error: 'Address not found' });
      return;
    }

    res.json(rows[0]);
  } catch (error) {
    console.error('Error retrieving address info:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET Address by Keyword
router.get('/search', async (req, res) => {
  const { keyword } = req.query;

  try {
    // Search for Bitcoin addresses matching the provided keyword
    const query = `
      SELECT * FROM addresses
      WHERE address LIKE $1;
    `;
    const { rows } = await pool.query(query, [`%${keyword}%`]);

    res.json(rows);
  } catch (error) {
    console.error('Error searching for addresses:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET Address Balance
router.get('/:address/balance', async (req, res) => {
  const address = req.params.address;

  try {
    // Calculate and return the balance of the specified Bitcoin address
    // You will need to implement the logic to calculate the balance based on transactions
    // You can query the transactions associated with the address from the database
    // and calculate the balance by summing up the relevant transaction amounts.
    // Then, send the balance as a JSON response.
    
    // Example:
    // const balance = calculateBalanceForAddress(address);
    // res.json({ balance });
  } catch (error) {
    console.error('Error calculating address balance:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET Address Transactions
router.get('/:address/transactions', async (req, res) => {
  const address = req.params.address;

  try {
    // Retrieve and return a list of transactions associated with the specified Bitcoin address
    // You can query the transactions associated with the address from the database.
    // Return the list of transactions as a JSON response.
  } catch (error) {
    console.error('Error retrieving address transactions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
