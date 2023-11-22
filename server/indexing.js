require('dotenv').config();
const bitcoin = require('bitcoin-core');
const { Pool } = require('pg');

const bitcoinRpcHost = process.env.BITCOIN_RPC_HOST;
const bitcoinRpcPort = process.env.BITCOIN_RPC_PORT;
const bitcoinRpcUsername = process.env.BITCOIN_RPC_USERNAME;
const bitcoinRpcPassword = process.env.BITCOIN_RPC_PASSWORD;
const databaseHost = process.env.DATABASE_HOST;
const databaseName = process.env.DATABASE_NAME;
const databaseUser = process.env.DATABASE_USER;
const databasePassword = process.env.DATABASE_PASSWORD;
const databasePort = process.env.DATABASE_PORT;
const zmqAddressENV = process.env.ZMQ_ADDRESS;


// Configure your Bitcoin Core connection
const bitcoinClient = new bitcoin({
  host: bitcoinRpcHost,
  port: bitcoinRpcPort, // Default Bitcoin Core RPC port
  username: bitcoinRpcUsername,
  password: bitcoinRpcPassword,
});

// Configure your PostgreSQL connection pool
const pool = new Pool({
  host: databaseHost,
  database: databaseName, // Replace with your database name
  user: databaseUser,
  password: databasePassword, // Replace with your database password
  port: databasePort,
});

// Define a function to save block data to the database
const saveBlockToDatabase = async (block) => {
  try {
    const query = `
      INSERT INTO blocks (block_hash, block_height, timestamp, transaction_count)
      VALUES ($1, $2, $3, $4);
    `;

    const values = [
      block.hash,
      block.height,
      new Date(block.time * 1000), // Convert Unix timestamp to JavaScript Date
      block.tx.length,
    ];

    await pool.query(query, values);
  } catch (error) {
    console.error('Error saving block to database:', error);
    throw error;
  }
};

// Define a function to listen for new blocks and save them to the database
const listenForNewBlocks = () => {
  // Connect to Bitcoin Core's ZMQ interface for new block notifications
  const zmq = require('zeromq');
  const sock = zmq.socket('sub');
  const zmqAddress = zmqAddressENV; // Replace with your ZMQ address

  sock.connect(zmqAddress);
  sock.subscribe('hashblock');

  sock.on('message', async (topic, message) => {
    if (topic.toString() === 'hashblock') {
      const blockHash = message.toString('hex');
      console.log(`New block detected: ${blockHash}`);

      try {
        // Retrieve block information from Bitcoin Core
        const blockInfo = await bitcoinClient.getBlock(blockHash);

        // Save the block to the database
        await saveBlockToDatabase(blockInfo);

        console.log(`Block saved to database: ${blockHash}`);
      } catch (error) {
        console.error('Error processing new block:', error);
      }
    }
  });

  console.log('Listening for new blocks...');
};

// Start listening for new blocks
listenForNewBlocks();
