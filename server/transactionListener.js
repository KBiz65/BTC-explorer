const zmq = require('zeromq');
const bitcoinClient = require('./bitcoinClient');

const UPDATE_INTERVAL = 5000; // 5 seconds
const MAX_TRANSACTIONS = 20;
const DISPLAY_TRANSACTIONS = 10;

async function run() {
    console.log('Initializing ZMQ subscriber...');
    const sock = zmq.socket('sub');

    sock.connect('tcp://127.0.0.1:28332');
    sock.subscribe('rawtx');

    console.log('Subscriber connected to port 28332');
    console.log('Listening for transactions...');

    let recentTransactions = [];
    let lastUpdateTime = Date.now();

    sock.on('message', async (topic, message) => {
        if (topic.toString() === 'rawtx') {
            const rawTx = message.toString('hex');
            
            try {
                const decodedTx = await bitcoinClient.decodeRawTransaction(rawTx);
                const totalAmount = decodedTx.vout.reduce((sum, output) => sum + output.value, 0);

                const txInfo = {
                    txid: decodedTx.txid,
                    amount: totalAmount,
                    time: new Date().toISOString()
                };

                recentTransactions.unshift(txInfo);

                // Keep only the most recent MAX_TRANSACTIONS
                if (recentTransactions.length > MAX_TRANSACTIONS) {
                    recentTransactions.pop();
                }

                // Check if it's time to update
                if (Date.now() - lastUpdateTime >= UPDATE_INTERVAL) {
                    updateTransactions(recentTransactions.slice(0, DISPLAY_TRANSACTIONS));
                    lastUpdateTime = Date.now();
                }
            } catch (error) {
                console.error('Error decoding transaction:', error.message);
            }
        }
    });

    process.on('SIGINT', () => {
        console.log('Closing subscriber...');
        sock.close();
        process.exit();
    });
}

function updateTransactions(transactions) {
    console.log('----------------------------------------');
    console.log(`Updating with ${transactions.length} recent transactions:`);
    transactions.forEach((tx, index) => {
        console.log(`${index + 1}. TxID: ${tx.txid}, Amount: ${tx.amount}, Time: ${tx.time}`);
    });
    console.log('----------------------------------------');
}

run().catch(error => {
    console.error('An error occurred:', error);
    process.exit(1);
});