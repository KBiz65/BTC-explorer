const zmq = require('zeromq');
const insertBlockIntoDatabase = require('./dbOperations/insertBlockIntoDatabase');
const bitcoinClient = require('./bitcoinClient');
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
            const block = await bitcoinClient.getBlock(blockHash, 2); // The second parameter ensures verbose data is returned
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
                block_reward: null, // Placeholder, to be calculated later
            };

            await insertBlockIntoDatabase(blockData);
            console.log(`Block ${block.hash} inserted into database.`);
        } catch (error) {
            console.error(`Error inserting block ${blockHash}:`, error);
            await logError('Block Processing Error', error.message, blockHash);
        }
    }
});

process.on('SIGINT', () => {
    sock.close();
    process.exit();
});
