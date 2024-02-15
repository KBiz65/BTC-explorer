require('dotenv').config();
const bitcoinClient = require('./bitcoinClient');
const insertBlockIntoDatabase = require('./dbOperations/insertBlockIntoDatabase');
const logError = require('./dbOperations/logError');

const main = async () => {
    try {
        const currentBlockchainHeight = await bitcoinClient.getBlockCount();
        const startBlock = 515796;

        for (let blockHeight = startBlock; blockHeight <= currentBlockchainHeight; blockHeight++) {
            try {
                const blockHash = await bitcoinClient.getBlockHash(blockHeight);
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
                console.log(`Block ${blockHeight} inserted.`);
            } catch (error) {
                console.error(`Error processing block ${blockHeight}:`, error);
                await logError('Block Processing Error', error.message, blockHash);
            }
        }
    } catch (error) {
        console.error('Error in main block seeding process:', error);
    }
};

main().catch(console.error);
