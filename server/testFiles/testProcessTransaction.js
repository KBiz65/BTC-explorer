const bitcoinClient = require('./bitcoinClient'); // Assuming this is your Bitcoin client connection

// Function to calculate total output
function calculateTotalOutput(transaction) {
    return transaction.vout.reduce((total, output) => total + output.value, 0);
}

// Function to calculate total input
async function calculateTotalInput(transaction) {
    let totalInput = 0;
    for (const input of transaction.vin) {
        if (!input.txid) continue; // Skipping coinbase transactions

        const prevTx = await bitcoinClient.getRawTransaction(input.txid, true);
        totalInput += prevTx.vout[input.vout].value;
    }
    return totalInput;
}

// Example usage
async function processTransaction(txid) {
    try {
        const transaction = await bitcoinClient.getRawTransaction(txid, true);
        const totalOutput = calculateTotalOutput(transaction);
        const totalInput = await calculateTotalInput(transaction);

        console.log(`Total Output: ${totalOutput}, Total Input: ${totalInput}`);
        // Further processing, like storing in database, can be done here
    } catch (error) {
        console.error('Error processing transaction:', error);
    }
}

// Replace with a real transaction ID to test
processTransaction('fffffd6ea754be7ac19d42c10e8f673d814432a119bbc9c7a041e56bc6f19884');
