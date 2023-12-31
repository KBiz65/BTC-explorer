const calculateTransactionFee = require('../testFiles/calculateTransactionFee');
const { determineInputType, determineOutputAddress } = require('./parseTransactionUtils');

const prepareTransactionData = async (transaction, blockhash) => {
    try {
        const transactionData = {
            transactionHash: transaction.txid,
            blockHash: blockhash,
            size: transaction.size,
            vsize: transaction.vsize,
            weight: transaction.weight,
            lockTime: transaction.locktime,
            version: transaction.version,
            timestamp: transaction.blocktime,
            fee: await calculateTransactionFee(transaction),
            inputs: [],
            outputs: [],
            isMultisig: false,
        };

        // Process inputs (vin)
        transactionData.inputs = transaction.vin.map(input => {
            // You can add more input properties here if needed
            return {
                txid: transaction.txid,
                previousTxHash: input.txid,
                outputIndex: input.vout,
                inputType: determineInputType(input),
                sequence: input.sequence,
                witnesses: input.txinwitness ? input.txinwitness : null 
            };
        });

        // Process outputs (vout) and check for multisig
        transactionData.outputs = transaction.vout.map(output => {
            const isPotentialMultisigType = output?.scriptPubKey?.type === 'scripthash' || output?.scriptPubKey?.type === 'witness_v0_scripthash';
            const asmParts = output?.scriptPubKey?.asm.split(' ');
            const hasMultisigOp = asmParts.includes('OP_CHECKMULTISIG') || asmParts.includes('OP_CHECKMULTISIGVERIFY');
            if (isPotentialMultisigType && hasMultisigOp) {
                transactionData.isMultisig = true; // Flag as potential multisig
            }

            return {
                txid: transaction.txid,
                value: output.value,
                outputIndex: output.n,
                outputType: output.scriptPubKey.type,
                address: determineOutputAddress(output)
            };
        });
        // console.log('transactionData: ', transactionData);
        return transactionData;
    } catch (error) {
        console.error('Error in prepareTransactionData:', error);
        throw error; // or handle the error as needed
    }
};

// const testTx = {
//     "txid": "b2088e443cf4b28ade8873cc6b3f6a67557f104ec4dc5b5e293c12973ab8b6b8",
//     "hash": "07b7639ca14f15b8b74e7c9339f7204561e87c0c2f6fc97b55a93339fa385602",
//     "version": 2,
//     "size": 150,
//     "vsize": 99,
//     "weight": 396,
//     "locktime": 799999,
//     "vin": [
//       {
//         "txid": "856bce86ad1f0039ccd9eabe49e58e640e3f05952bd0a26d6687710d3de9a5ad",
//         "vout": 0,
//         "scriptSig": {
//           "asm": "",
//           "hex": ""
//         },
//         "txinwitness": [
//           "8725b5708b34e9c77a537ebfd6f18bae78f6f67c1a4da15098a44ccad802998fddcc225023731c8729461ebee6eebf1a200a0df86a141aff703dc6a572db5438"
//         ],
//         "sequence": 0
//       }
//     ],
//     "vout": [
//       {
//         "value": 0.00499441,
//         "n": 0,
//         "scriptPubKey": {
//           "asm": "0 9549a8a78144db492bedbbe57b99343d034bfafb",
//           "desc": "addr(bc1qj4y63fupgnd5j2ldh0jhhxf585p5h7hm0gzjfc)#3ze4scwd",
//           "hex": "00149549a8a78144db492bedbbe57b99343d034bfafb",
//           "address": "bc1qj4y63fupgnd5j2ldh0jhhxf585p5h7hm0gzjfc",
//           "type": "witness_v0_keyhash"
//         }
//       }
//     ],
//     "hex": "02000000000101ada5e93d0d7187666da2d02b95053f0e648ee549beead9cc39001fad86ce6b8500000000000000000001f19e0700000000001600149549a8a78144db492bedbbe57b99343d034bfafb01408725b5708b34e9c77a537ebfd6f18bae78f6f67c1a4da15098a44ccad802998fddcc225023731c8729461ebee6eebf1a200a0df86a141aff703dc6a572db5438ff340c00",
//     "blockhash": "00000000000000000002a7c4c1e48d76c5a37902165a270156b7a8d72728a054",
//     "confirmations": 20957,
//     "time": 1690168629,
//     "blocktime": 1690168629
//   }

// prepareTransactionData(testTx);

module.exports = prepareTransactionData;
