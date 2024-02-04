require('dotenv').config();
const { Worker, isMainThread, parentPort } = require('worker_threads');
const { playStartChime } = require('./utils/playStartChime');

// Import database operation functions
const insertBlockIntoDatabase = require('./dbOperations/insertBlockIntoDatabase');
const prepareTransactionData = require('./utils/prepareTransactionData');
const batchInsertTransactions = require('./dbOperations/batchInsertTransactions');
const logError = require('./dbOperations/logError');

// Import bitcoinClient connection
const bitcoinClient = require('./bitcoinClient');

const BATCH_THRESHOLD = 3000;
const MAX_WORKERS = 10;
const MAX_BLOCKS_PER_WORKER = 10; // Limit for each worker
let activeWorkers = 0;
let blockQueue = [];

const processBlock = async (blockHeight, accumulatedTransactions) => {
	try {
		const blockHash = await bitcoinClient.getBlockHash(blockHeight);
		const blockInfo = await bitcoinClient.getBlock(blockHash);
		await insertBlockIntoDatabase(blockInfo);

		console.log(`Processing block ${blockHeight} with ${blockInfo.tx.length} transactions...`);
		for (const [index, txid] of blockInfo.tx.entries()) {
			try {
				const transaction = await bitcoinClient.getRawTransaction(txid, true);
				const decodedTransaction = await bitcoinClient.command('decoderawtransaction', transaction.hex);
				const transactionData = await prepareTransactionData(decodedTransaction, transaction.blockhash);
				accumulatedTransactions.push(transactionData);

				// console.log(`Adding transaction ${index + 1} of block ${blockHeight} to the array.`);
			} catch (transactionError) {
				console.error(`Error processing transaction ${txid} in block ${blockHeight}:`, transactionError);
				await logError('Transaction Processing Error', transactionError.message, blockHash, txid);
			}
		}
	} catch (blockError) {
		console.error(`Error processing block ${blockHeight}:`, blockError);
		await logError(
			'Block Processing Error',
			`Failed to process block at height ${blockHeight}: ${blockError.message}`,
			blockHash
		);
	}
};

const startWorker = () => {
	const worker = new Worker(__filename);
	playStartChime(); // Notify that new worker created
	activeWorkers++; // Increment active workers since new worker started
	console.log('activeWorkers: ', activeWorkers);
	worker.on('message', async (message) => {
		if (message.type === 'request_block') {
			if (blockQueue.length > 0) {
				const blockHeight = blockQueue.shift();
				worker.postMessage({ type: 'process_block', blockHeight });
			} else {
				worker.postMessage({ type: 'no_blocks_left' });
			}
		} else if (message.type === 'error') {
			console.error(`Error processing block ${message.blockHeight}: ${message.error}`);
			await logError('Block Processing Error', message.error, message.blockHash, message.transactionHash);
			activeWorkers--;
		} else if (message.type === 'completed_processing') {
			// Worker has completed its task, start a new worker if blocks are left
			activeWorkers--;
			worker.terminate();
			if (blockQueue.length > 0) {
				startWorker();
			} else if (activeWorkers === 0) {
				console.log('All workers have completed their tasks. Exiting program.');
				process.exit(0);
			}
		}
	});
	worker.on('error', (error) => {
		console.error('Worker error:', error);
	});
	worker.on('exit', (code) => {
		if (code !== 0) console.error(`Worker stopped with exit code ${code}`);
	});
};

if (isMainThread) {
	const main = async () => {
		console.log(`main function is running, isMainThread: ${isMainThread}`);
		// test blocks need to be declared here. Leave the global
		// blockQueue as an empty array. The main thread needs to
		// handle the blockQueue but it needs to be declared globally.
		// blockQueue = [278785];
		// Obtain the current blockchain height
		const currentBlockchainHeight = await bitcoinClient.getBlockCount();
		// Initialize block queue with all block heights
		const startBlock = 278786; // The block number from which you want to start
		blockQueue = Array.from({ length: currentBlockchainHeight - startBlock + 1 }, (_, i) => i + startBlock);

		for (let i = 0; i < MAX_WORKERS; i++) {
			startWorker();
		}
	};

	main().catch((e) => console.error(e));
} else {
	let accumulatedTransactions = [];
	let processedBlockHeights = [];
	let throttleTime = 0; // Initial throttle time
	const MAX_RESPONSE_TIME = 5000; // Maximum response time in milliseconds before throttling
	const NORMAL_RESPONSE_TIME = 1000; // Response time indicating server is responding normally
	const THROTTLE_INCREMENT = 1000; // Increment to increase throttle time
	const THROTTLE_DECREMENT = 100; // Decrement to decrease throttle time
	let batchStartBlock = null; // Track the first block in the current batch
	let processedBlocksCount = 0; // Track the number of processed blocks by this worker

	// Function to request the next block to process
	const requestNextBlock = () => {
		parentPort.postMessage({ type: 'request_block' });
	};

	// Listen for messages from the main thread
	parentPort.on('message', async (message) => {
		if (message.type === 'process_block') {
			const blockHeight = message.blockHeight;
			batchStartBlock = batchStartBlock === null ? blockHeight : batchStartBlock;
			// Throttling mechanism
			if (throttleTime > 0) {
				await new Promise((resolve) => setTimeout(resolve, throttleTime));
			}

			// Start timing the RPC call
			const startTime = Date.now();
			await processBlock(blockHeight, accumulatedTransactions);
			processedBlockHeights.push(blockHeight);
			const endTime = Date.now();
			const duration = endTime - startTime;

			// Adjust throttle time based on response duration
			if (duration > MAX_RESPONSE_TIME) {
				throttleTime += THROTTLE_INCREMENT;
			} else if (duration < NORMAL_RESPONSE_TIME && throttleTime > 0) {
				throttleTime = Math.max(0, throttleTime - THROTTLE_DECREMENT);
			}
			// Check if BATCH_THRESHOLD is reached
			if (accumulatedTransactions.length >= BATCH_THRESHOLD) {
				await batchInsertTransactions(accumulatedTransactions);
				console.log(
					`Blocks ${processedBlockHeights.join(', ')} have been successfully inserted into the database.`
				);
				accumulatedTransactions = [];
				processedBlockHeights = [];
				batchStartBlock = null;
			}

			processedBlocksCount++;
			if (processedBlocksCount < MAX_BLOCKS_PER_WORKER) {
				requestNextBlock();
			} else {
				// When the MAX_BLOCKS_PER_WORKER limit is reached, insert any remaining transactions
				if (accumulatedTransactions.length > 0) {
					await batchInsertTransactions(accumulatedTransactions);
					console.log(
						`Worker processed ${processedBlocksCount} blocks. Inserting final batch into the database.`
					);
					accumulatedTransactions = [];
					processedBlockHeights = [];
					batchStartBlock = null;
				}
				parentPort.postMessage({ type: 'completed_processing' });
			}
		} else if (message.type === 'no_blocks_left') {
			// Final insertion for remaining transactions
			if (accumulatedTransactions.length > 0) {
				await batchInsertTransactions(accumulatedTransactions);
				console.log(`Final batch has been successfully inserted into the database.`);
			}
			parentPort.postMessage({ type: 'completed_processing' });
		}
	});

	// Initial request for a block
	requestNextBlock();
}
