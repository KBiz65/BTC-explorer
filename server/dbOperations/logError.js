const pool = require('../database');

const logError = async (errorType, errorMessage, associatedBlockHash = null, associatedTransactionHash = null) => {
    const client = await pool.connect();
    try {
        const query = `
            INSERT INTO error_logs (error_type, error_message, associated_block_hash, associated_transaction_hash)
            VALUES ($1, $2, $3, $4);
        `;
        const values = [errorType, errorMessage, associatedBlockHash, associatedTransactionHash];
        await client.query(query, values);
    } catch (logError) {
        console.error('Error logging to database:', logError);
    } finally {
        client.release();
    }
};

module.exports = logError;
