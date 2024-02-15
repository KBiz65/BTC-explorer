const bitcoinClient = require('./bitcoinClient');
const pool = require('./database'); // Assuming this exports a pg Pool instance

async function updateBlockRewards(startHeight, endHeight) {
    for (let height = startHeight; height <= endHeight; height++) {
        try {
            const blockHash = await bitcoinClient.getBlockHash(height);
            const block = await bitcoinClient.getBlock(blockHash); // Verbosity defaults to 1
            
            // Coinbase txid is the first one in the list
            const coinbaseTxId = block.tx[0];
            // Fetch the detailed coinbase transaction
            const coinbaseTx = await bitcoinClient.getRawTransaction(coinbaseTxId, true);

            // The block reward is in the first vout of the coinbase transaction
            const blockReward = coinbaseTx.vout.reduce((acc, currVout) => acc + currVout.value, 0);

            await pool.query(
                'UPDATE blocks SET block_reward = $1 WHERE block_hash = $2',
                [blockReward, blockHash]
            );

            console.log(`Updated block reward for height ${height}: ${blockReward} BTC`);
        } catch (error) {
            console.error(`Error updating block reward for height ${height}:`, error);
        }
    }
}

const START_BLOCK_HEIGHT = 1;
const END_BLOCK_HEIGHT = 830213;

updateBlockRewards(START_BLOCK_HEIGHT, END_BLOCK_HEIGHT)
    .then(() => console.log('Finished updating block rewards'))
    .catch(error => console.error('Error in updating block rewards:', error));
