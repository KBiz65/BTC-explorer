require('dotenv').config();
const { Pool } = require('pg');

const databaseHost = process.env.DATABASE_HOST;
const databaseName = process.env.DATABASE_NAME;
const databaseUser = process.env.DATABASE_USER;
const databasePassword = process.env.DATABASE_PASSWORD;
const databasePort = process.env.DATABASE_PORT;

// Create a PostgreSQL connection pool with your server.js configuration
const pool = new Pool({
  host: databaseHost,
  database: databaseName, // Replace with your database name
  user: databaseUser,
  password: databasePassword,       // Replace with your database password
  port: databasePort,
});

async function testDatabaseConnection() {
  try {
    // Use the database connection pool to execute a sample query
    const result = await pool.query('SELECT * FROM transactions LIMIT 5'); // Limit to 5 rows for example

    // Log the result to the console
    console.log('Database connection test successful!');
    
    // Log the first 5 rows from the transactions table
    console.log('First 5 rows from the transactions table:');
    for (const row of result.rows) {
      console.log(row);
    }
  } catch (error) {
    console.error('Error testing the database connection:', error);
  } finally {
    // Release the database connection
    pool.end();
  }
}

// Call the test function
testDatabaseConnection();
