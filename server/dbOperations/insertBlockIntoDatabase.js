const pool = require('../database');

const insertBlockIntoDatabase = async (blockInfo) => {
    const client = await pool.connect();
    try {
        const blockQuery = `
            INSERT INTO blocks (block_hash, version, previous_block_hash, merkle_root, block_time, bits, nonce, height, size, weight, num_transactions, confirmations, timestamp)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
            ON CONFLICT (block_hash) DO NOTHING;
        `;

        // Adjust data to match db field types
        const bits = parseInt(blockInfo.bits, 16);

        // Assuming 'total_fees' is calculated elsewhere and added to blockInfo
        const values = [
            blockInfo.hash,
            blockInfo.version,
            blockInfo.previousblockhash,
            blockInfo.merkleroot,
            blockInfo.time,
            bits,
            blockInfo.nonce,
            blockInfo.height,
            blockInfo.size,
            blockInfo.weight,
            blockInfo.nTx,
            blockInfo.confirmations,
            new Date(blockInfo.time * 1000),
        ];

        await client.query(blockQuery, values);
    } catch (error) {
        console.error('Error saving block to database:', error);
        throw error;
    } finally {
        client.release();
    }
};

module.exports = insertBlockIntoDatabase;
