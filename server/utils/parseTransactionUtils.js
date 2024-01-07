const bitcoin = require('bitcoinjs-lib');

// needs to take in an entire VIN array from the transaction
function determineInputType(input) {
    let isSegWit = false;
    let isP2WPKH = false;
    let isP2WSH = false;

    if (input?.txinwitness && input?.scriptSig?.hex === "") {
        isSegWit = true;

        if (input.txinwitness.length === 2) {
            isP2WPKH = true;
        } else if (input.txinwitness.length > 2) {
            isP2WSH = true;
        }
    }

    const scriptSig = input?.scriptSig?.asm;

    // P2PKH: OP_PUSHDATA <signature> OP_PUSHDATA <pubkey>, possibly followed by [ALL] or similar
    // This pattern accounts for the presence of signature hash type indicators like [ALL]
    if (/^[\da-fA-F]+(\[\w+\])?\s[\da-fA-F]+(\[\w+\])?$/.test(scriptSig)) {
        return "P2PKH";
    }

    // P2SH: The scriptSig contains a redeem script which is not possible to parse without full context
    if (/^0\s+[\da-fA-F]+/.test(scriptSig)) {
        return "P2SH";
    }

    // P2PK: Single pushdata containing a signature followed by a pubkey
    if (/^[\da-fA-F]+\s+[\da-fA-F]+$/.test(scriptSig)) {
        return "P2PK";
    }

    // Multisig: OP_0 followed by multiple signatures
    if (/^0\s+([\da-fA-F]+\s+)+/.test(scriptSig)) {
        return "Multisig";
    }

    // Coinbase transaction
    if (input.coinbase) {
        return "Coinbase";
    }

    if (isSegWit) {
        if (isP2WPKH) {
            return "SegWit (P2WPKH)";
        }
        if (isP2WSH) {
            return "SegWit (P2WSH)";
        }
        return "SegWit (Unspecified Type)";
    }

    // Default return if no type is determined
    return "Unknown";
}


function determineOutputAddress(output) {
    // If the output already contains an address, return it
    if (output?.scriptPubKey && output?.scriptPubKey?.address && output?.scriptPubKey?.address.length > 0) {
        return output.scriptPubKey.address;
    }

    // If the output type is pubkey, derive the address from the public key
    if (output.scriptPubKey && output.scriptPubKey.type === 'pubkey') {
        try {
            const pubkeyBuffer = Buffer.from(output.scriptPubKey.asm.split(' ')[0], 'hex');
            const { address } = bitcoin.payments.p2pkh({ pubkey: pubkeyBuffer });
            return address;
        } catch (error) {
            console.error('Error deriving address from public key:', error);
            return 'unknown';
        }
    }

    // If no address can be determined, return 'unknown'
    return 'unknown';
}

module.exports = {
    determineInputType,
    determineOutputAddress,
}