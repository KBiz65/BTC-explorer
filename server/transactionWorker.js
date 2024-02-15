const { parentPort, workerData } = require('worker_threads');
const prepareTransactionData = require('./utils/prepareTransactionData');

const processTransaction = async (transaction) => {
    try {
        const preparedData = await prepareTransactionData(transaction);
        // Post the prepared data back to the parent thread
        parentPort.postMessage({ type: 'transactionProcessed', data: preparedData });
    } catch (error) {
        // Post back the error details
        parentPort.postMessage({ 
            type: 'error', 
            message: `Error processing transaction ${transaction.txid}: ${error.message}`, 
            txid: transaction.txid 
        });
        console.log('error: ', error.message);
    }
};

// If the worker was started with an initial transaction, process it.
if (workerData.transaction) {
    processTransaction(workerData.transaction);
}

// Listen for new transactions from the parent thread and process them.
parentPort.on('message', (msg) => {
    if (msg.type === 'shutdown') {
        // Exit gracefully
        process.exit(0);
    } else if (msg.transaction) {
        processTransaction(msg.transaction);
    }
});