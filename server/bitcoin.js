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

const bitcoinClient = new bitcoin({
  host: bitcoinRpcHost,
  port: bitcoinRpcPort,
  username: bitcoinRpcUsername,
  password: bitcoinRpcPassword,
});

const pool = new Pool({
  user: databaseUser,
  host: databaseHost,
  database: databaseName,
  password: databasePassword,
  port: databasePort,
});

const saveTransactionToDatabase = async (transaction) => {
  try {
    const query = `
      INSERT INTO transactions (txid, blockhash, confirmations, time)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (txid) DO NOTHING;
    `;

    const values = [
      transaction.txid,
      transaction.blockhash,
      transaction.confirmations,
      transaction.time,
    ];

    await pool.query(query, values);
  } catch (error) {
    console.error('Error saving transaction to database:', error);
    throw error;
  }
};

// Define functions for interacting with Bitcoin Core and saving transactions
const getBlockInfo = async (blockHash) => {
  try {
    const blockInfo = await bitcoinClient.getBlock(blockHash);

    // Save transactions to the database
    for (const txid of blockInfo.tx) {
      const transaction = {
        txid,
        blockhash: blockInfo.hash,
        confirmations: blockInfo.confirmations,
        time: blockInfo.time,
      };

      await saveTransactionToDatabase(transaction);
    }

    return blockInfo;
  } catch (error) {
    console.error('Error retrieving block info:', error);
    throw error;
  }
};

const getAddressInfo = async (address) => {
  try {
    const addressInfo = await bitcoinClient.getReceivedByAddress(address);
    return addressInfo;
  } catch (error) {
    console.error('Error retrieving address info:', error);
    throw error;
  }
};

// Export the functions
module.exports = {
  getBlockInfo,
  getAddressInfo,
};
