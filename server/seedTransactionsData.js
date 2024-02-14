require('dotenv').config();
const { Worker } = require('worker_threads');
const bitcoinClient = require('./bitcoinClient');
const logError = require('./dbOperations/logError');
const batchInsertTransactions = require('./dbOperations/batchInsertTransactions');

const MAX_WORKERS = 10;
let activeWorkers = 0;
let transactionQueue = []; // Queue to manage transactions for processing
let preparedTransactions = []; // Accumulate prepared transactions for batch insertion

// Function to process a single block's transactions
const processBlockTransactions = async (blockHeight) => {
    try {
        const blockHash = await bitcoinClient.getBlockHash(blockHeight);
        const block = await bitcoinClient.getBlock(blockHash, 2); // Get transaction details
        console.log(`Processing block ${blockHeight} with ${block.tx.length} transactions...`);
        transactionQueue = block.tx.map(tx => ({ ...tx, block_hash: blockHash }));
        assignTransactionsToWorkers();
    } catch (error) {
        console.error(`Error processing block ${blockHeight}:`, error);
        await logError('Block Processing Error', error.message, blockHash);
    }
};

// Function to assign transactions to available workers
const assignTransactionsToWorkers = () => {
    while (activeWorkers < MAX_WORKERS && transactionQueue.length > 0) {
        const transaction = transactionQueue.shift(); // Get next transaction
        processTransaction(transaction);
    }
};

// Function to process a transaction using a worker
const processTransaction = (transaction) => {
    activeWorkers++;
    const worker = new Worker('./transactionWorker.js', { workerData: { transaction } });
    worker.on('message', (preparedData) => {
        preparedTransactions.push(preparedData);
        activeWorkers--;
        if (transactionQueue.length > 0) {
            assignTransactionsToWorkers(); // Assign next transaction
        } else if (activeWorkers === 0) {
            batchInsertPreparedTransactions(); // All transactions processed, initiate batch insert
        }
    });
    worker.on('error', (error) => {
        console.error(`Error processing transaction ${transaction.txid}:`, error);
        activeWorkers--;
        assignTransactionsToWorkers(); // Attempt to continue processing the next transaction
    });
};

// Function to batch insert prepared transactions
const batchInsertPreparedTransactions = async () => {
    if (preparedTransactions.length > 0) {
        await batchInsertTransactions(preparedTransactions);
        console.log('Batch insert completed.');
        preparedTransactions = []; // Reset for the next batch
    }
};

// Main function to process blocks in a range
const processBlocksInRange = async (startBlockHeight, endBlockHeight) => {
    for (let blockHeight = startBlockHeight; blockHeight <= endBlockHeight; blockHeight++) {
        await processBlockTransactions(blockHeight);
        // Wait for all transactions of the current block to be processed before moving to the next
        while (activeWorkers > 0) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    }
    console.log('All blocks processed.');
};

// Execute the main function with a specific range of blocks
processBlocksInRange(1001, 50000).catch(console.error);
