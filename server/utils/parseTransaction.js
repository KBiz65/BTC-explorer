const {
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
    getAddressFromTxRaw,
} = require('./parseTransactionUtils');

const parseTransaction = (tx) => {
    const txHex = tx.hex;
    const txid = tx.txid;
    const txBytes = hexToBytes(txHex);
    let cursor = 0;

    // Parse the version
    const version = bytesToInt(readBytes(txBytes, cursor, 4));
    cursor += 4;

    // Detect SegWit transactions by checking for marker and flag
    let isSegWit = false;
    if (txBytes[cursor] === 0x00 && txBytes[cursor + 1] !== 0x00) {
        isSegWit = true;
        cursor += 2;
    }

    // Parse the number of inputs
    const inputCount = readVarInt(txBytes, cursor, 'inputCount');
    cursor += varIntSize(inputCount);
    
    // Parse each input
    const inputs = [];
    for (let i = 0; i < inputCount; i++) {
        // console.log(`txBytes: ${txBytes} / cursor: ${cursor}`);

        const previousTxHash = bytesToHex(readBytes(txBytes, cursor, 32).reverse());
        cursor += 32;
        
        const outputIndex = bytesToInt(readBytes(txBytes, cursor, 4));
        cursor += 4;
        
        const scriptLength = readVarInt(txBytes, cursor, 'scriptLength inputs');
        cursor += varIntSize(scriptLength);

        const scriptSigBytes = readBytes(txBytes, cursor, scriptLength);
        const scriptSig = bytesToHex(scriptSigBytes);
        cursor += scriptLength;

        const sequence = bytesToInt(readBytes(txBytes, cursor, 4));
        cursor += 4;

        // Determine the input type (e.g., P2PKH, P2SH) based on scriptSig structure
        let inputType = determineInputType(scriptSigBytes, previousTxHash, isSegWit);
        inputs.push({ txid, previousTxHash, outputIndex, scriptSig, sequence, inputType, witnesses: [] });
    }


    // Parse the number of outputs
    const outputCount = readVarInt(txBytes, cursor, 'outputCount');
    cursor += varIntSize(outputCount);

    // Parse each output
    const outputs = [];
    for (let i = 0; i < outputCount; i++) {
        const value = bytesToBigInt(readBytes(txBytes, cursor, 8));
        cursor += 8;

        const scriptLength = readVarInt(txBytes, cursor, 'scriptLength outputs');
        cursor += varIntSize(scriptLength);

        const scriptPubKey = readBytes(txBytes, cursor, scriptLength);
        cursor += scriptLength;

        const outputType = determineOutputType(scriptPubKey);

        const address = getAddressFromTxRaw(txHex, outputType, i);
        outputs.push({ txid, value, scriptPubKey: bytesToHex(scriptPubKey), address, outputIndex: i, outputType });
    }

    // If SegWit, parse witness data
    if (isSegWit) {
        for (let i = 0; i < inputCount; i++) {
            if (inputs[i].isCoinbase) {
                continue;
            };

            const witnessCount = readVarInt(txBytes, cursor, 'witnessCount');
            cursor += varIntSize(witnessCount);

            for (let j = 0; j < witnessCount; j++) {
                const witnessLength = readVarInt(txBytes, cursor, 'witnessLength');
                cursor += varIntSize(witnessLength);

                const witnessData = readBytes(txBytes, cursor, witnessLength);
                cursor += witnessLength;

                const witnessHex = bytesToHex(witnessData);
                const witnessType = determineWitnessType(witnessHex);

                inputs[i].witnesses.push({ witness: witnessData, witnessType });
            }
        }
    }

    // Parse locktime
    const lockTime = bytesToInt(readBytes(txBytes, cursor, 4));

    return { version, inputs, outputs, lockTime };
}

// const testTx = {
//   "txid": "0c61b8488f6f9905e8cea73e0a124298c503881923b6c414694c5f02e4f06fae",
//   "hash": "b0e6ba0d679532fcfef85f702df0a33cc2d1503be994cea9081fa78dec4a39c5",
//   "version": 1,
//   "size": 372,
//   "vsize": 209,
//   "weight": 834,
//   "locktime": 0,
//   "vin": [
//     {
//       "txid": "1b143e06cd3d8fa58f0c85645eb27ee86271ccf913ad061e58a95166dd81b5c2",
//       "vout": 1,
//       "scriptSig": {
//         "asm": "",
//         "hex": ""
//       },
//       "txinwitness": [
//         "304502210087985e4a460994cbe5308734cb8522122f0fa770ede1078871b75392714fd9180220383757950ffb8d9f6215a13273c5f139229a86dfe1fb5112c2d0f11ad948c8de01",
//         "0259de9321f035ac56c9ee9cdf2df88f5ab9578d961ee7db16950d3ee8a2c82f32"
//       ],
//       "sequence": 4294967295
//     },
//     {
//       "txid": "a033fb81bef21c173530528af7368ded4bf080d5ec28f6afd4639a14eb222661",
//       "vout": 0,
//       "scriptSig": {
//         "asm": "",
//         "hex": ""
//       },
//       "txinwitness": [
//         "3045022100eca31c85198b1a450285c9f2b9aff43f7994fe104c17bff3ee785991356e926d02207b1f77bedb2db76868773207078683d7eaca71830864ecc1a584228efaa8763301",
//         "0259de9321f035ac56c9ee9cdf2df88f5ab9578d961ee7db16950d3ee8a2c82f32"
//       ],
//       "sequence": 4294967295
//     }
//   ],
//   "vout": [
//     {
//       "value": 0.00033551,
//       "n": 0,
//       "scriptPubKey": {
//         "asm": "0 7b6121adacb6a05d174b3e0a3070f7333257c4c6",
//         "desc": "addr(bc1q0dsjrtdvk6s9696t8c9rqu8hxve903xxmdl97q)#rc4l74cc",
//         "hex": "00147b6121adacb6a05d174b3e0a3070f7333257c4c6",
//         "address": "bc1q0dsjrtdvk6s9696t8c9rqu8hxve903xxmdl97q",
//         "type": "witness_v0_keyhash"
//       }
//     },
//     {
//       "value": 0.03486750,
//       "n": 1,
//       "scriptPubKey": {
//         "asm": "0 a5f2c8fc411b293f1818bcc8845e2478cbc806ef",
//         "desc": "addr(bc1q5hev3lzprv5n7xqchnyggh3y0r9usph0y2dx3x)#ekgjpymw",
//         "hex": "0014a5f2c8fc411b293f1818bcc8845e2478cbc806ef",
//         "address": "bc1q5hev3lzprv5n7xqchnyggh3y0r9usph0y2dx3x",
//         "type": "witness_v0_keyhash"
//       }
//     }
//   ],
//   "hex": "01000000000102c2b581dd6651a9581e06ad13f9cc7162e87eb25e64850c8fa58f3dcd063e141b0100000000ffffffff612622eb149a63d4aff628ecd580f04bed8d36f78a523035171cf2be81fb33a00000000000ffffffff020f830000000000001600147b6121adacb6a05d174b3e0a3070f7333257c4c61e34350000000000160014a5f2c8fc411b293f1818bcc8845e2478cbc806ef0248304502210087985e4a460994cbe5308734cb8522122f0fa770ede1078871b75392714fd9180220383757950ffb8d9f6215a13273c5f139229a86dfe1fb5112c2d0f11ad948c8de01210259de9321f035ac56c9ee9cdf2df88f5ab9578d961ee7db16950d3ee8a2c82f3202483045022100eca31c85198b1a450285c9f2b9aff43f7994fe104c17bff3ee785991356e926d02207b1f77bedb2db76868773207078683d7eaca71830864ecc1a584228efaa8763301210259de9321f035ac56c9ee9cdf2df88f5ab9578d961ee7db16950d3ee8a2c82f3200000000",
//   "blockhash": "0000000000000000000876c199fed4adb6d8c98c5782ab99e5d720fb8e6b2697",
//   "confirmations": 73852,
//   "time": 1658937511,
//   "blocktime": 1658937511
// }

// parseTransaction(testTx);

module.exports = parseTransaction;
