require('dotenv').config();
const bitcoin = require('bitcoin-core');
const { Pool } = require('pg');

// Import utility functions from the utils folder
const extractSenderAddress = require('./utils/extractSenderAddress');
const findRecipientAddress = require('./utils/findRecipientAddress');

const bitcoinNetwork = process.env.BITCOIN_NETWORK;
const bitcoinRpcHost = process.env.BITCOIN_RPC_HOST;
const bitcoinRpcPort = process.env.BITCOIN_RPC_PORT;
const bitcoinRpcUsername = process.env.BITCOIN_RPC_USERNAME;
const bitcoinRpcPassword = process.env.BITCOIN_RPC_PASSWORD;
const databaseHost = process.env.DATABASE_HOST;
const databaseName = process.env.DATABASE_NAME;
const databaseUser = process.env.DATABASE_USER;
const databasePassword = process.env.DATABASE_PASSWORD;
const databasePort = process.env.DATABASE_PORT;

const BATCH_THRESHOLD = 3000;  // Adjust this threshold as needed

const bitcoinClient = new bitcoin({
  network: bitcoinNetwork,
  host: bitcoinRpcHost,
  port: bitcoinRpcPort,
  username: bitcoinRpcUsername,
  password: bitcoinRpcPassword,
});

const pool = new Pool({
  host: databaseHost,
  database: databaseName,
  user: databaseUser,
  password: databasePassword,
  port: databasePort,
});

const insertBlockIntoDatabase = async (blockInfo) => {
  const client = await pool.connect();
  try {
    const blockQuery = `
      INSERT INTO blocks (block_hash, block_height, timestamp, merkle_root, previous_block_hash, nonce, difficulty, size, version, confirmations, transaction_count)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      ON CONFLICT (block_hash) DO NOTHING;
    `;

    const values = [
      blockInfo.hash,
      blockInfo.height,
      new Date(blockInfo.time * 1000),
      blockInfo.merkleroot,
      blockInfo.previousblockhash,
      blockInfo.nonce,
      blockInfo.difficulty,
      blockInfo.size,
      blockInfo.version,
      blockInfo.confirmations,
      blockInfo.tx.length,
    ];

    await client.query(blockQuery, values);
  } catch (error) {
    console.error('Error saving block to database:', error);
    throw error;
  } finally {
    client.release();
  }
};

const prepareTransactionData = async (transaction, blockTimestamp) => {
  const transactionFee = await calculateTransactionFee(transaction);
  const transactionData = {
    transactionHash: transaction.txid,
    blockHash: transaction.blockhash,
    version: transaction.version,
    size: transaction.size,
    vsize: transaction.vsize,
    weight: transaction.weight,
    lockTime: transaction.locktime,
    timestamp: blockTimestamp,
    confirmations: transaction.confirmations,
    fee: transactionFee,
    inputs: [],
    outputs: [],
  };

  for (let i = 0; i < transaction.vin.length; i++) {
    const input = transaction.vin[i];
    const senderAddress = await extractSenderAddress(input, bitcoinClient);
    transactionData.inputs.push({
      transactionHash: transaction.txid,
      previousTransactionHash: input.txid,
      outputIndex: input.vout,
      scriptSig: input.scriptSig ? input.scriptSig.hex : null,
      sequence: input.sequence,
      witness: input.txinwitness ? input.txinwitness.join(' ') : null,
      senderAddress: senderAddress,
    });
  }

  for (let i = 0; i < transaction.vout.length; i++) {
    const output = transaction.vout[i];
    const receiverAddress = findRecipientAddress([output]);
    transactionData.outputs.push({
      transactionHash: transaction.txid,
      value: output.value,
      scriptPubKey: output.scriptPubKey.hex,
      address: receiverAddress,
      outputIndex: i,
    });
  }

  return transactionData;
};

const batchInsertTransactions = async (transactions) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    for (const transaction of transactions) {
      const transactionQuery = `
        INSERT INTO transactions (transaction_hash, block_hash, version, size, vsize, weight, lock_time, timestamp, confirmations, fee)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT (transaction_hash) DO NOTHING;
      `;

      const transactionValues = [
        transaction.transactionHash,
        transaction.blockHash,
        transaction.version,
        transaction.size,
        transaction.vsize,
        transaction.weight,
        transaction.lockTime,
        transaction.timestamp,
        transaction.confirmations,
        transaction.fee,
      ];

      await client.query(transactionQuery, transactionValues);

      for (const input of transaction.inputs) {
        const inputQuery = `
          INSERT INTO inputs (transaction_hash, previous_transaction_hash, output_index, script_sig, sequence, witness, sender_address)
          VALUES ($1, $2, $3, $4, $5, $6, $7);
        `;

        const inputValues = [
          input.transactionHash,
          input.previousTransactionHash,
          input.outputIndex,
          input.scriptSig,
          input.sequence,
          input.witness,
          input.senderAddress, // Ensure this is correctly obtained in prepareTransactionData
        ];

        await client.query(inputQuery, inputValues);
      }

      for (const output of transaction.outputs) {
        const outputQuery = `
          INSERT INTO outputs (transaction_hash, value, script_pub_key, receiver_address, output_index)
          VALUES ($1, $2, $3, $4, $5);
        `;

        const outputValues = [
          output.transactionHash,
          output.value,
          output.scriptPubKey,
          output.receiverAddress, // Ensure this is correctly obtained in prepareTransactionData
          output.outputIndex,
        ];

        await client.query(outputQuery, outputValues);
      }
    }

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error in batch transaction:', error);
    throw error;
  } finally {
    client.release();
  }
};

const calculateTransactionFee = async (transaction) => {
  let totalInputs = 0;
  let totalOutputs = transaction.vout.reduce((acc, output) => acc + output.value, 0);

  for (const input of transaction.vin) {
    if (input.coinbase) {
      return 0;
    }

    const inputTx = await bitcoinClient.getRawTransaction(input.txid, true);
    const inputTxOutput = inputTx.vout[input.vout];
    totalInputs += inputTxOutput.value;
  }

  return totalInputs - totalOutputs;
};

const logError = async (blockHeight, error) => {
  const client = await pool.connect();
  try {
    const query = `
      INSERT INTO error_logs (block_height, error_message)
      VALUES ($1, $2);
    `;
    const values = [blockHeight, error.message || error.toString()];

    await client.query(query, values);
  } catch (logError) {
    console.error('Error logging to database:', logError);
  } finally {
    client.release();
  }
};

const indexBlocks = async () => {
  try {
    const blockCount = await bitcoinClient.getBlockCount();
    let accumulatedTransactions = [];
    let accumulatedTransactionCount = 0;
    let startBlockHeight = 1;

    for (let blockHeight = 1; blockHeight <= blockCount; blockHeight++) {
    // for (let blockHeight = 367853; blockHeight <= 367853; blockHeight++) {
      try {
        const blockHash = await bitcoinClient.getBlockHash(blockHeight);
        const blockInfo = await bitcoinClient.getBlock(blockHash);
        await insertBlockIntoDatabase(blockInfo);

        console.log(`Processing block ${blockHeight} with ${blockInfo.tx.length} transactions...`);
        for (const [index, txid] of blockInfo.tx.entries()) {
          try {
            const transaction = await bitcoinClient.getRawTransaction(txid, true);
            const blockTimestamp = new Date(blockInfo.time * 1000);
            const transactionData = await prepareTransactionData(transaction, blockTimestamp);
            accumulatedTransactions.push(transactionData);
            accumulatedTransactionCount++;

            console.log(`Adding transaction ${index + 1} of block ${blockHeight} to the array.`);
          } catch (transactionError) {
            console.error(`Error processing transaction ${txid} in block ${blockHeight}:`, transactionError);
            await logError(blockHeight, transactionError);
          }
        }

        if (accumulatedTransactionCount >= BATCH_THRESHOLD || blockHeight === blockCount) {
          if (accumulatedTransactions.length > 0) {
            await batchInsertTransactions(accumulatedTransactions);
            console.log(`Blocks ${startBlockHeight} - ${blockHeight} have been processed.`);
            accumulatedTransactions = []; 
            accumulatedTransactionCount = 0;
            startBlockHeight = blockHeight + 1;
          }
        }
      } catch (blockError) {
        console.error(`Error processing block ${blockHeight}:`, blockError);
        await logError(blockHeight, blockError);
      }
    }
  } catch (overallError) {
    console.error('Error in indexing blocks:', overallError);
    await logError(null, overallError);
  }
};

indexBlocks();
