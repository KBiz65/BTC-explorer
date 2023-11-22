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
  host: databaseHost,
  database: databaseName, // Replace with your database name
  user: databaseUser,
  password: databasePassword,       // Replace with your database password
  port: databasePort,
});

const saveTransactionToDatabase = async (transaction, blockHash) => {
  try {
    const query = `
      INSERT INTO transactions (transaction_hash, block_hash, inputs, outputs, fee, timestamp)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (transaction_hash) DO NOTHING;
    `;

    const values = [
      transaction.txid,
      blockHash,
      JSON.stringify(transaction.vin),
      JSON.stringify(transaction.vout),
      transaction.fee,
      new Date(), // You may need to adjust the timestamp value
    ];

    await pool.query(query, values);
  } catch (error) {
    console.error('Error saving transaction to database:', error);
    throw error;
  }
};

const updateOrInsertAddress = async (address, transactionData) => {
  try {
    // Check if the address exists in the "addresses" table
    const addressQuery = `
      SELECT * FROM addresses WHERE address = $1;
    `;

    const addressValues = [address];

    const addressResult = await pool.query(addressQuery, addressValues);

    if (addressResult.rowCount === 0) {
      // If the address doesn't exist, insert a new record
      const insertAddressQuery = `
        INSERT INTO addresses (address, balance, transactions)
        VALUES ($1, $2, $3);
      `;

      const insertAddressValues = [
        address,
        transactionData.balance,
        JSON.stringify([transactionData]),
      ];

      await pool.query(insertAddressQuery, insertAddressValues);
    } else {
      // If the address exists, update the balance and transaction history
      const existingAddress = addressResult.rows[0];
      existingAddress.transactions.push(transactionData);

      const updateAddressQuery = `
        UPDATE addresses
        SET balance = $1, transactions = $2
        WHERE address = $3;
      `;

      const updateAddressValues = [
        existingAddress.balance + transactionData.balance,
        JSON.stringify(existingAddress.transactions),
        address,
      ];

      await pool.query(updateAddressQuery, updateAddressValues);
    }
  } catch (error) {
    console.error('Error updating or inserting address:', error);
    throw error;
  }
};

const insertBlockIntoDatabase = async (blockInfo) => {
  try {
    // Insert the block into the "blocks" table
    const blockQuery = `
      INSERT INTO blocks (block_hash, block_height, timestamp, transaction_count)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (block_hash) DO NOTHING;
    `;

    const values = [
      blockInfo.hash,
      blockInfo.height,
      new Date(blockInfo.time * 1000), // Convert Unix timestamp to JavaScript timestamp
      blockInfo.nTx, // Assuming this is the transaction count in the block
    ];

    await pool.query(blockQuery, values);
  } catch (error) {
    console.error('Error saving block to database:', error);
    throw error;
  }
};

const indexBlocks = async () => {
  try {
    const blockCount = await bitcoinClient.getBlockCount();

    for (let blockHeight = 163994; blockHeight <= blockCount; blockHeight++) {
      const blockHash = await bitcoinClient.getBlockHash(blockHeight);
      const blockInfo = await bitcoinClient.getBlock(blockHash);

      // Insert the block into the "blocks" table
      await insertBlockIntoDatabase(blockInfo);

      // Save transactions to the database
      for (const txid of blockInfo.tx) {
        const transaction = await bitcoinClient.getRawTransaction(txid, true);
        await saveTransactionToDatabase(transaction, blockHash);

        // Update or insert address records based on transaction data
        for (const input of transaction.vin) {
          if (input.scriptPubKey && input.scriptPubKey.addresses && input.scriptPubKey.addresses.length > 0) {
            const inputAddress = input.scriptPubKey.addresses[0];
            await updateOrInsertAddress(inputAddress, transaction);
          }
        }

        for (const output of transaction.vout) {
          if (output.scriptPubKey && output.scriptPubKey.addresses && output.scriptPubKey.addresses.length > 0) {
            const outputAddress = output.scriptPubKey.addresses[0];
            await updateOrInsertAddress(outputAddress, transaction);
          }
        }
      }

      console.log(`Block ${blockHeight} indexed.`);
    }
  } catch (error) {
    console.error('Error indexing blocks:', error);
  }
};

// Start indexing blocks
indexBlocks();
