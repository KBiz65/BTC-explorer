require('dotenv').config();
const { Worker, isMainThread, parentPort } = require('worker_threads');
const { playStartChime } = require('./utils/playStartChime');
const insertBlockIntoDatabase = require('./dbOperations/insertBlockIntoDatabase');
const prepareTransactionData = require('./utils/prepareTransactionData');
const batchInsertTransactions = require('./dbOperations/batchInsertTransactions');
const logError = require('./dbOperations/logError');
const bitcoinClient = require('./bitcoinClient');

const BATCH_THRESHOLD = 3000;
const MAX_WORKERS = 8;
const MAX_BLOCKS_PER_WORKER = 10;
let activeWorkers = 0;
let blockQueue = [];

const processBlock = async (blockHeight) => {
    try {
        const blockHash = await bitcoinClient.getBlockHash(blockHeight);
        const blockInfo = await bitcoinClient.getBlock(blockHash);
        await insertBlockIntoDatabase(blockInfo);

        console.log(`Processing block ${blockHeight} with ${blockInfo.tx.length} transactions...`);
        const transactions = await Promise.all(
            blockInfo.tx.map(async (txid) => {
                try {
                    const transaction = await bitcoinClient.getRawTransaction(txid, true);
                    const decodedTransaction = await bitcoinClient.command('decoderawtransaction', transaction.hex);
                    return await prepareTransactionData(decodedTransaction, transaction.blockhash);
                } catch (transactionError) {
                    console.error(`Error processing transaction ${txid} in block ${blockHeight}:`, transactionError);
                    await logError(blockHeight, transactionError);
                    return null;
                }
            })
        );

        return transactions.filter(tx => tx !== null);
    } catch (blockError) {
        console.error(`Error processing block ${blockHeight}:`, blockError);
        await logError(
            'Block Processing Error',
            `Failed to process block at height ${blockHeight}: ${blockError.message}`,
            blockHash
        );
        return [];
    }
};

const workerFunction = async () => {
    let accumulatedTransactions = [];
    let processedBlocksCount = 0;

    console.log("Worker started");

    parentPort.on('message', async (message) => {
        console.log(`Worker received message: ${JSON.stringify(message)}`);

        if (message.type === 'process_block') {
            const blockHeight = message.blockHeight;
            const newTransactions = await processBlock(blockHeight);
            accumulatedTransactions.push(...newTransactions);

            if (accumulatedTransactions.length >= BATCH_THRESHOLD) {
                await batchInsertTransactions(accumulatedTransactions);
                accumulatedTransactions = [];
            }

            processedBlocksCount++;
            if (processedBlocksCount < MAX_BLOCKS_PER_WORKER) {
                parentPort.postMessage({ type: 'request_next_block' });
            } else {
                if (accumulatedTransactions.length > 0) {
                    await batchInsertTransactions(accumulatedTransactions);
                    accumulatedTransactions = [];
                }
                console.log("Completed processing assigned blocks");
                parentPort.postMessage({ type: 'completed_processing' });
            }
        }
    });
}

if (!isMainThread) {
    workerFunction();
}

const main = async () => {
    const currentBlockchainHeight = await bitcoinClient.getBlockCount();
    const startBlock = 337867;
    blockQueue = Array.from({ length: currentBlockchainHeight - startBlock + 1 }, (_, i) => i + startBlock);

    console.log(`Total blocks to process: ${blockQueue.length}`);

    for (let i = 0; i < MAX_WORKERS; i++) {
        if (blockQueue.length === 0) break;
        const worker = new Worker(__filename);
        worker.on('message', (message) => messageHandler(message, worker));
        worker.on('error', errorHandler);
        worker.on('exit', exitHandler);
        playStartChime();
        activeWorkers++;
        console.log(`Started worker ${i + 1}`);
        // Send the first block to each worker
        sendNextBlockToWorker(worker);
    }
};

const messageHandler = async (message, worker) => {
    console.log(`Main thread received message: ${JSON.stringify(message)}`);
    if (message.type === 'completed_processing') {
        activeWorkers--;
        console.log(`Worker completed processing. Active workers: ${activeWorkers}`);
        if (activeWorkers === 0 && blockQueue.length === 0) {
            console.log('All workers have completed their tasks. Exiting program.');
            process.exit(0);
        }
    } else if (message.type === 'request_next_block') {
        sendNextBlockToWorker(worker);
    }
};

const sendNextBlockToWorker = (worker) => {
    if (blockQueue.length > 0) {
        const blockHeight = blockQueue.shift();
        worker.postMessage({ type: 'process_block', blockHeight });
    } else {
        worker.postMessage({ type: 'no_blocks_left' });
    }
};

const errorHandler = (error) => {
    console.error('Worker error:', error);
    activeWorkers--;
};

const exitHandler = (code) => {
    if (code !== 0) console.error(`Worker stopped with exit code ${code}`);
    activeWorkers--;
};

if (isMainThread) {
    main().catch((e) => console.error(e));
}