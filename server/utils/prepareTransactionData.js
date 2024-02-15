const calculateTransactionFee = require('../utils/calculateTransactionFee');
const { determineOutputAddress } = require('./parseTransactionUtils');

const prepareTransactionData = async (transaction) => {
    try {
        // Initialize the structure based on your schema
        const transactionData = {
            txid: transaction.txid,
            txhash: transaction.hash ? transaction.hash : null, // Assuming the transaction object has a 'hash' property for SegWit transactions
            block_hash: transaction.block_hash,
            size: transaction.size,
            virtual_size: transaction.vsize,
            weight: transaction.weight,
            lock_time: transaction.locktime,
            version: transaction.version,
            fees: transaction.fee !== undefined ? transaction.fee : await calculateTransactionFee(transaction),
            inputs: [],
            outputs: []
        };

        // Process inputs
        transactionData.inputs = transaction.vin.map((input, index) => {
            // Input processing adjusted for the schema
            const prev_txid = input.txid ? input.txid : input.coinbase ? 'coinbase' : 'unknown';
            const prev_vout_idx = input.vout ?? -1;
            return {
                txid: transaction.txid,
                referenced_txid: prev_txid,
                referenced_output_index: prev_vout_idx,
                input_sequence: input.sequence,
                witnesses: input.txinwitness ? input.txinwitness : []
                // Note: Determine if additional properties are needed for your inputs processing
            };
        });

        // Process outputs
        transactionData.outputs = transaction.vout.map((output, index) => {
            // Output processing adjusted for the schema
            return {
                txid: transaction.txid,
                amount: output.value,
                output_index: output.n,
                address: determineOutputAddress(output)
                // Note: 'spent' is not determined here and defaults to FALSE in the database
            };
        });

        return transactionData;
    } catch (error) {
        console.error('Error in prepareTransactionData:', error);
        throw error; // or handle the error as needed
    }
};

module.exports = prepareTransactionData;
