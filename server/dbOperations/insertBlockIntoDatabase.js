const pool = require('../database');

const insertBlockIntoDatabase = async (blockInfo) => {
    const client = await pool.connect();
    try {
        const blockQuery = `
            INSERT INTO blocks (block_hash, version, versionhex, previous_block_hash, merkle_root, block_timestamp, mediantime, nonce, bits, difficulty, chainwork, ntx, height, strippedsize, size, weight, block_reward)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
            ON CONFLICT (block_hash) DO NOTHING;
        `;

        const values = [
            blockInfo.block_hash,
            blockInfo.version,
            blockInfo.versionHex,
            blockInfo.previous_block_hash ?? null,
            blockInfo.merkle_root,
            blockInfo.block_timestamp,
            blockInfo.mediantime,
            blockInfo.nonce,
            blockInfo.bits,
            blockInfo.difficulty,
            blockInfo.chainwork,
            blockInfo.nTx,
            blockInfo.height,
            blockInfo.strippedsize,
            blockInfo.size,
            blockInfo.weight,
            blockInfo.block_reward,
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
