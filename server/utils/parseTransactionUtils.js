const bitcoin = require('bitcoinjs-lib');
const crypto = require('crypto');

const hexToBytes = (hex) => {
    let bytes = [];
    for (let c = 0; c < hex.length; c += 2) {
        bytes.push(parseInt(hex.substr(c, 2), 16));
    }
    return bytes;
}

const bytesToHex = (bytes) => {
    return bytes.map(byte => byte.toString(16).padStart(2, '0')).join('');
}

const readBytes = (bytes, start, length) => {
    return bytes.slice(start, start + length);
}

const bytesToInt = (bytes) => {
    return bytes.reduce((total, byte, index) => total + byte * Math.pow(256, index), 0);
}

const bytesToBigInt = (bytes) => {
    let result = BigInt(0);
    for (let i = 0; i < bytes.length; i++) {
        result += BigInt(bytes[i]) << (BigInt(i) * 8n);
    }
    return result;
}

const readVarInt = (bytes, start, callingFunc) => {
    const firstByte = bytes[start];
    if (firstByte < 253) {
        return firstByte;
    } else if (firstByte === 253) {
        return (bytes[start + 2] << 8) + bytes[start + 1];
    } else if (firstByte === 254) {
        return bytes[start + 1] | (bytes[start + 2] << 8) | (bytes[start + 3] << 16) | (bytes[start + 4] << 24);
    } else {
        return (
            BigInt(bytes[start + 1]) |
            (BigInt(bytes[start + 2]) << 8n) |
            (BigInt(bytes[start + 3]) << 16n) |
            (BigInt(bytes[start + 4]) << 24n) |
            (BigInt(bytes[start + 5]) << 32n) |
            (BigInt(bytes[start + 6]) << 40n) |
            (BigInt(bytes[start + 7]) << 48n) |
            (BigInt(bytes[start + 8]) << 56n)
        );
    }
}

const varIntSize = (varInt) => {
    if (varInt < 253) {
        return 1; // Single byte
    } else if (varInt < 65536) {
        return 3; // 1 marker byte + 2 data bytes
    } else if (varInt < 4294967296) {
        return 5; // 1 marker byte + 4 data bytes
    } else {
        return 9; // 1 marker byte + 8 data bytes
    }
}

const determineInputType = (scriptSig, previousTxHash, isSegWit) => {
    const zeroTxid = '0000000000000000000000000000000000000000000000000000000000000000';
    if (previousTxHash === zeroTxid) return "Coinbase";

    if (isSegWit) return "Segwit";

    if (scriptSig.length === 0) {
        return "Non-SegWit or Witness Data Separate";
    }

    // P2PKH: OP_PUSHDATA <signature> OP_PUSHDATA <pubkey>
    if (scriptSig[0] <= 0x4b && scriptSig[scriptSig.length - 33 - 1] === 0x21) {
        return "P2PKH";
    }

    // P2SH: Redeem script pushed onto the stack, but structure varies widely
    if (scriptSig[0] === 0x00 && scriptSig[scriptSig.length - 1] === 0x87) {
        return "P2SH";
    }

    // P2PK: OP_PUSHDATA <signature> <pubkey>
    // Check for pushdata of signature and 65-byte uncompressed pubkey or 33-byte compressed pubkey
    if (scriptSig[0] <= 0x4b && (scriptSig[scriptSig.length - 65 - 1] === 0x41 || scriptSig[scriptSig.length - 33 - 1] === 0x21)) {
        return "P2PK";
    }

    // Multisig: OP_0 <signature1> <signature2> ... (number of signatures varies)
    // This pattern is oversimplified and may not always accurately identify multisig
    if (scriptSig[0] === 0x00) {
        return "Multisig";
    }

    // Bare Multisig // may not cover all bare multisig scripts
    if (scriptSig.some(byte => byte === 0xae)) { // OP_CHECKMULTISIG
        return "Bare Multisig";
    }

    // Time-locked Scripts (OP_CHECKLOCKTIMEVERIFY and OP_CHECKSEQUENCEVERIFY)
    if (scriptSig.some(byte => byte === 0xb1 || byte === 0xb2)) { // OP_CHECKLOCKTIMEVERIFY or OP_CHECKSEQUENCEVERIFY
        return "Time-locked Script";
    }

    // OP_RETURN: Data recording output (provably unspendable)
    // Typically used to embed data, so no unlocking script is required
    if (scriptSig[0] === 0x6a) {
        return "OP_RETURN";
    }

    // Add additional patterns for other types as needed

    return "Unknown";
}

const determineOutputType = (scriptPubKey) => {
    // P2PK
    if (scriptPubKey[scriptPubKey.length - 1] === 0xac && (scriptPubKey[0] === 0x41 || scriptPubKey[0] === 0x21)) {
        return "P2PK";
    }
    
    // P2PKH: OP_DUP OP_HASH160 <PubKeyHash> OP_EQUALVERIFY OP_CHECKSIG
    if (scriptPubKey[0] === 0x76 && scriptPubKey[1] === 0xa9 && scriptPubKey[scriptPubKey.length - 2] === 0x88 && scriptPubKey[scriptPubKey.length - 1] === 0xac) {
        return "P2PKH";
    }

    // P2SH: OP_HASH160 <ScriptHash> OP_EQUAL
    if (scriptPubKey[0] === 0xa9 && scriptPubKey[scriptPubKey.length - 1] === 0x87) {
        return "P2SH";
    }

    // OP_RETURN: Data recording output (provably unspendable)
    if (scriptPubKey[0] === 0x6a) {
        return "OP_RETURN";
    }

    // P2WPKH and P2WSH can be identified by their script length and starting byte
    // P2WPKH: 0x00 <20-byte-key-hash>
    // P2WSH: 0x00 <32-byte-script-hash>
    if (scriptPubKey[0] === 0x00) {
        if (scriptPubKey.length === 22) {
            return "P2WPKH";
        } else if (scriptPubKey.length === 34) {
            return "P2WSH";
        }
    }

    // Bare Multisig
    if (scriptPubKey.includes(0xae)) { // OP_CHECKMULTISIG
        return "Multisig";
    }

    // Time-Locked Scripts (basic detection)
    if (scriptPubKey.includes(0xb1) || scriptPubKey.includes(0xb2)) { // OP_CHECKLOCKTIMEVERIFY or OP_CHECKSEQUENCEVERIFY
        return "Time-Locked Script";
    }

    // If the script type is not able to be determined, return unknow for 
    // future iterations.
    return "Unknown";
}

function determineWitnessType(witness) {
    if (witness.length === 2) {
        // Typical P2WPKH pattern: [signature, pubkey]
        if (witness[1].length === 66) { // Compressed pubkey (33 bytes, 66 hex chars)
            return "P2WPKH";
        }
    } else if (witness.length > 2) {
        const redeemScript = witness[witness.length - 1];
        if (redeemScript.length > 60) { // Heuristic check for redeem script length
            const redeemScriptType = analyzeRedeemScript(redeemScript);
            return redeemScriptType || "P2WSH";
        }
    }

    // Other or unknown witness types
    return "Unknown";
}

function analyzeRedeemScript(redeemScript) {
    // Convert redeem script from hex to bytes
    const scriptBytes = hexToBytes(redeemScript);

    // Example: Basic Multisig Redeem Script Analysis
    // Multisig redeem scripts usually start with OP_m, end with OP_n OP_CHECKMULTISIG
    if (scriptBytes[0] >= 0x51 && scriptBytes[0] <= 0x60 && scriptBytes[scriptBytes.length - 1] === 0xae) {
        return "P2WSH-Multisig";
    }

    // Example: Time-lock scripts
    if (scriptBytes.includes(0xb1) || scriptBytes.includes(0xb2)) { // OP_CHECKLOCKTIMEVERIFY or OP_CHECKSEQUENCEVERIFY
        return "P2WSH-TimeLocked";
    }

    // Add further analysis for other redeem script patterns

    return 'unknown P2WSH'; // No specific pattern identified
}

function getAddressFromTxRaw(rawTx, outputIndex, scriptType, network = bitcoin.networks.bitcoin) {
    try {
        // Parse the raw transaction data
        const tx = bitcoin.Transaction.fromHex(rawTx);

        // Extract the specified output
        const output = tx.outs[outputIndex];
        if (!output) return "unknown";

        if (scriptType === 'P2PKH') {
            // Handle Pay-to-Public-Key-Hash (P2PKH) script
            return bitcoin.address.fromOutputScript(output.script, network);
        } else if (scriptType === 'P2PK') {
            // Handle Pay-to-Public-Key (P2PK) script
            const publicKey = output.script.slice(1, -1); // Assuming the script format is <PUSH> <pubKey> <OP_CHECKSIG>
            const publicKeyHash = crypto.createHash('ripemd160').update(crypto.createHash('sha256').update(publicKey).digest()).digest();
            return bitcoin.payments.p2pkh({ hash: publicKeyHash, network }).address;
        } else {
            console.error('Unsupported script type:', scriptType);
            return "unknown";
        }
    } catch (error) {
        console.error('Error extracting address:', error);
        return "unknown";
    }
}

module.exports = {
    hexToBytes,
    bytesToHex,
    readBytes,
    bytesToInt,
    bytesToBigInt,
    readVarInt,
    varIntSize,
    determineInputType,
    determineOutputType,
    determineWitnessType,
    getAddressFromTxRaw
}