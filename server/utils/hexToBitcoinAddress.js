const crypto = require('crypto');

function hexToBitcoinAddress(hexPublicKey) {
    try {
        // Remove the first two and last two characters from hexPublicKey
        hexPublicKey = hexPublicKey.slice(2, -2);

        // Step 1: Decode the hexadecimal public key
        const publicKeyBuffer = Buffer.from(hexPublicKey, 'hex');

        // Step 2: Perform SHA-256 hash on the public key
        const sha256Hash = crypto.createHash('sha256').update(publicKeyBuffer).digest();

        // Step 3: Perform RIPEMD-160 hash on the SHA-256 hash
        const ripemd160Hash = crypto.createHash('ripemd160').update(sha256Hash).digest();

        // Step 4: Add the network byte (0x00 for mainnet) to the RIPEMD-160 hash
        const networkByte = Buffer.from([0x00]);
        const extendedRipemd160Hash = Buffer.concat([networkByte, ripemd160Hash]);

        // Step 5: Perform SHA-256 hash on the extended RIPEMD-160 hash twice
        const sha256Hash1 = crypto.createHash('sha256').update(extendedRipemd160Hash).digest();
        const sha256Hash2 = crypto.createHash('sha256').update(sha256Hash1).digest();

        // Step 6: Take the first 4 bytes of the double SHA-256 hash as a checksum
        const checksum = sha256Hash2.slice(0, 4);

        // Step 7: Add the checksum to the extended RIPEMD-160 hash
        const binaryAddress = Buffer.concat([extendedRipemd160Hash, checksum]);

        // Step 8: Encode the binary address to Base58
        const base58Address = encodeBase58(binaryAddress);

        return base58Address;
    } catch (error) {
        console.error('Error converting hex to Bitcoin address:', error.message);
        return null;
    }
}

function encodeBase58(buffer) {
    const ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
    const BASE = ALPHABET.length;

    let leadingZeros = 0;
    for (let i = 0; i < buffer.length; i++) {
        if (buffer[i] === 0) {
            leadingZeros++;
        } else {
            break;
        }
    }

    let x = BigInt('0x' + buffer.toString('hex'));
    let output = '';

    while (x > 0n) {
        const remainder = x % BigInt(BASE);
        output = ALPHABET[Number(remainder)] + output;
        x = x / BigInt(BASE);
    }

    for (let i = 0; i < leadingZeros; i++) {
        output = '1' + output;
    }

    return output;
}


module.exports = hexToBitcoinAddress;
