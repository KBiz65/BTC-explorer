const bitcoinjslib = require('bitcoinjs-lib');
const findRecipientAddress = require('./findRecipientAddress');

async function extractSenderAddress(input, bitcoinClient, network = bitcoinjslib.networks.bitcoin) {
    try {
        let senderAddress = null;

        // For SegWit transactions
        if (input.txinwitness) {
            const witness = input.txinwitness.map(x => Buffer.from(x, 'hex'));
            const witnessScript = bitcoinjslib.payments.p2wpkh({ witness, network }).address;
            senderAddress = witnessScript;
        }
        // For non-SegWit transactions
        else if (input.scriptSig) {
            // Fetch the previous transaction
            const prevTx = await bitcoinClient.getRawTransaction(input.txid, true);

            senderAddress = await findRecipientAddress(prevTx.vout);
        }

        return senderAddress;
    } catch (error) {
        console.error('Error extracting sender address:', error);
        return null;
    }
}

module.exports = extractSenderAddress;