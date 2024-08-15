const zmq = require('zeromq');
const bitcoinClient = require('./bitcoinClient');
// const { processBlocksInRange } = require('./seedTransactionsData'); // Import the function
const insertBlockIntoDatabase = require('./dbOperations/insertBlockIntoDatabase');
const logError = require('./dbOperations/logError');

let sock = zmq.socket('sub');

// Connect to the ZeroMQ port provided by your Bitcoin node
sock.connect('tcp://127.0.0.1:28332');
sock.subscribe('hashblock');

console.log('Listener connected to port 28332');

sock.on('message', async (topic, message) => {
    if (topic.toString() === 'hashblock') {
        let blockHash = message.toString('hex');
        console.log('New block detected:', blockHash);

        try {
            const block = await bitcoinClient.getBlock(blockHash);
            const coinbaseTxId = block.tx[0];
            // Fetch the detailed coinbase transaction
            const coinbaseTx = await bitcoinClient.getRawTransaction(coinbaseTxId, true);

            // The block reward is in the first vout of the coinbase transaction
            const blockReward = coinbaseTx.vout.reduce((acc, currVout) => acc + currVout.value, 0);

            const blockData = {
                block_hash: block.hash,
                version: block.version,
                versionHex: block.versionHex,
                previous_block_hash: block.previousblockhash,
                merkle_root: block.merkleroot,
                block_timestamp: block.time,
                mediantime: block.mediantime,
                nonce: block.nonce,
                bits: block.bits,
                difficulty: block.difficulty,
                chainwork: block.chainwork,
                nTx: block.nTx,
                height: block.height ?? null,
                strippedsize: block.strippedsize,
                size: block.size,
                weight: block.weight,
                block_reward: blockReward
            };

            await insertBlockIntoDatabase(blockData);
            console.log(`Block ${block.height} inserted into database.`);
            // await processBlocksInRange(block.height, block.height); 
        } catch (error) {
            console.error(`Error processing block ${blockHash}:`, error);
            await logError('Block Processing Error', error.message, blockHash);
        }
    }
});

process.on('SIGINT', () => {
    sock.close();
    process.exit();
});