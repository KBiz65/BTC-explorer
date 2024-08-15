require('dotenv').config();
const { Worker } = require('worker_threads');
const bitcoinClient = require('./bitcoinClient');
const logError = require('./dbOperations/logError');
const batchInsertTransactions = require('./dbOperations/batchInsertTransactions');

const MAX_WORKERS = 15;
let activeWorkers = 0;
let transactionQueue = [];
let preparedTransactions = [];

async function processTransaction(transaction) {
    return new Promise((resolve, reject) => {
        const worker = new Worker('./transactionWorker.js', { workerData: { transaction } });
        // if (activeWorkers === MAX_WORKERS) console.log('Max workers working');

        worker.on('message', async (message) => {
            if (message.type === 'transactionProcessed') {
                preparedTransactions.push(message.data);
                if (transactionQueue.length > 0) {
                    worker.postMessage({ transaction: transactionQueue.shift() });
                } else {
                    // There are no more transactions to process so we need to terminate the worker.
                    // This will trigger the 'exit' and resolve the promise.
                    worker.postMessage({ type: 'shutdown' });
                };
            }
        });

        worker.on('error', error => {
            console.error('Worker error:', error);
            reject(error);
        });

        worker.on('exit', (code) => {
            activeWorkers--;
            if (code === 0) {
                // Worker exited successfully
                resolve();
            } else {
                // Worker exited with an error code
                console.error(`Worker exited with code ${code}`);
                reject(new Error(`Worker exited with code ${code}`));
            }
        });
    });
}

async function assignTransactionsToWorkers() {
    let workerPromises = [];
    while (activeWorkers < MAX_WORKERS && transactionQueue.length > 0) {
        activeWorkers++;
        const transaction = transactionQueue.shift();
        workerPromises.push(processTransaction(transaction));
    }

    await Promise.all(workerPromises);
    if (preparedTransactions.length > 0) {
        await batchInsertPreparedTransactions();
    }
}

async function batchInsertPreparedTransactions() {
    if (preparedTransactions.length > 0) {
        await batchInsertTransactions(preparedTransactions)
            .then(() => {
                console.log('Batch insert completed.');
                preparedTransactions = []; // Reset for the next batch
            })
            .catch(error => console.error('Batch insert error:', error));
    }
}

async function processBlockTransactions(blockHeight) {
    try {
        const blockHash = await bitcoinClient.getBlockHash(blockHeight);
        const block = await bitcoinClient.getBlock(blockHash, 2);
        console.log(`Processing block ${blockHeight} with ${block.tx.length} transactions...`);
        transactionQueue.push(...block.tx.map((tx) => ({ ...tx, block_hash: blockHash })));
        await assignTransactionsToWorkers();
    } catch (error) {
        console.error(`Error processing block ${blockHeight}:`, error);
        // await logError('Block Processing Error', error.message, blockHash);
    }
}

async function processBlocksInRange(startBlockHeight, endBlockHeight) {
        for (let blockHeight = startBlockHeight; blockHeight <= endBlockHeight; blockHeight++) {
        await processBlockTransactions(blockHeight);
    }
    if (startBlockHeight === endBlockHeight) {
        console.log(`Block ${startBlockHeight} processed.`);
    } else {
        console.log(`Blocks ${startBlockHeight} to ${endBlockHeight} processed.`);
    }
}

processBlocksInRange(836974, 850000).catch(console.error);
// processBlocksInRange(850001, current number).catch(console.error);

module.exports = { processBlocksInRange };