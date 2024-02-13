require('dotenv').config();
const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');
const { playStartChime } = require('./utils/playStartChime');

// Import bitcoinClient connection
const bitcoinClient = require('./bitcoinClient');

// Import database operation functions
const prepareTransactionData = require('./utils/prepareTransactionData');
const batchInsertTransactions = require('./dbOperations/batchInsertTransactions');
const logError = require('./dbOperations/logError');

const MAX_WORKERS = 10;

if (isMainThread) {
    const startBlockHeight = 401744;
    const endBlockHeight = 401750;

    const processBlock = async (blockHeight) => {
        try {
            const blockHash = await bitcoinClient.getBlockHash(blockHeight);
            const block = await bitcoinClient.getBlock(blockHash, 1); // 1 for verbose mode to get transaction details
            
            console.log(`Processing block ${blockHeight} with ${block.tx.length} transactions...`);
            for (const txid of block.tx) {
                // Create a worker for each transaction
                const worker = new Worker(__filename, { workerData: { txid } });
                worker.on('message', (message) => {
                    console.log(message); // Handle success message
                });
                worker.on('error', (error) => {
                    console.error(`Error processing transaction ${txid}:`, error);
                    // Implement logic to handle the error, e.g., retrying, logging, or halting the process
                });
                worker.on('exit', (code) => {
                    if (code !== 0) {
                        console.error(`Worker stopped with exit code ${code}`);
                    }
                });
                // Wait for the worker to finish before continuing
                await new Promise((resolve, reject) => {
                    worker.on('exit', resolve);
                    worker.on('error', reject);
                });
            }
        } catch (error) {
            console.error(`Error processing block ${blockHeight}:`, error);
            logError('Block Processing Error', error.message, blockHash);
            // Decide how to handle block-level errors, e.g., retry or halt
        }
    };

    const main = async () => {
        for (let blockHeight = startBlockHeight; blockHeight <= endBlockHeight; blockHeight++) {
            await processBlock(blockHeight);
        }
        console.log('All transactions processed.');
    };

    main().catch(console.error);
} else {
    // Worker thread: process a single transaction
    const { txid } = workerData;
    processTransaction(txid)
        .then(() => {
            parentPort.postMessage(`Transaction ${txid} processed successfully.`);
        })
        .catch((error) => {
            parentPort.postMessage(`Error processing transaction ${txid}: ${error.message}`);
            process.exit(1); // Exit with an error code to indicate failure
        });
}