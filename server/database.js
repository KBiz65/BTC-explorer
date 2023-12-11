require('dotenv').config();
const { Pool } = require('pg');

const databaseHost = process.env.DATABASE_HOST;
const databaseName = process.env.DATABASE_NAME;
const databaseUser = process.env.DATABASE_USER;
const databasePassword = process.env.DATABASE_PASSWORD;
const databasePort = process.env.DATABASE_PORT;

const pool = new Pool({
  host: databaseHost,
  database: databaseName,
  user: databaseUser,
  password: databasePassword,
  port: databasePort,
});

module.exports = pool;
