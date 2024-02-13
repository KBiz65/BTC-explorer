const { parentPort, workerData } = require('worker_threads');
const prepareTransactionData = require('./utils/prepareTransactionData');

const { transaction } = workerData;

const processTransaction = async (transaction) => {
    try {
        const preparedData = await prepareTransactionData(transaction);
        // Post the prepared data back to the parent thread
        parentPort.postMessage({ type: 'transaction', data: preparedData });
    } catch (error) {
        // Post back the error details
        parentPort.postMessage({ 
            type: 'error', 
            message: `Error processing transaction ${transaction.txid}: ${error.message}`, 
            txid: transaction.txid 
        });
        process.exit(1); // Exit with an error code to indicate failure
    }
};

processTransaction(transaction);