require('dotenv').config();
const axios = require('axios');
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
    password: databasePassword, // Replace with your database password
    port: databasePort,
});
// GET Address by Keyword
router.get('/:searchTerm', async (req, res) => {
    const searchTerm = req.params.searchTerm;
    const results = [];

    try {
        const responses = await Promise.allSettled([
          axios.get(`http://localhost:3001/addresses/${searchTerm}`),
          axios.get(`http://localhost:3001/blocks/${searchTerm}`),
          axios.get(`http://localhost:3001/transactions/${searchTerm}`),
        ]);
      
        // Process and filter valid responses
        const results = [];
        for (const response of responses) {
          if (response.status === 'fulfilled') {
              if (response.value.data) {
                  console.log('response.value: ', response.value);
              results.push(response.value.data);
            }
          }
        }
      
        res.json(results);
      } catch (error) {
        // Handle other errors that might occur, like unexpected exceptions
        console.error('Unexpected error:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
});

module.exports = router;
