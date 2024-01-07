const calculateTransactionFee = require('./calculateTransactionFee');
const { determineInputType, determineOutputAddress } = require('../utils/parseTransactionUtils');

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
        console.log('transactionData: ', transactionData);
        return transactionData;
    } catch (error) {
        console.error('Error in prepareTransactionData:', error);
        throw error; // or handle the error as needed
    }
};

const testTx = {
  "txid": "e3bf3d07d4b0375638d5f1db5255fe07ba2c4cb067cd81b84ee974b6585fb468",
  "hash": "e3bf3d07d4b0375638d5f1db5255fe07ba2c4cb067cd81b84ee974b6585fb468",
  "version": 1,
  "size": 133,
  "vsize": 133,
  "weight": 532,
  "locktime": 0,
  "vin": [
    {
      "coinbase": "0456720e1b00",
      "sequence": 4294967295
    }
  ],
  "vout": [
    {
      "value": 50.00000000,
      "n": 0,
      "scriptPubKey": {
        "asm": "04124b212f5416598a92ccec88819105179dcb2550d571842601492718273fe0f2179a9695096bff94cd99dcccdea7cd9bd943bfca8fea649cac963411979a33e9 OP_CHECKSIG",
        "desc": "pk(04124b212f5416598a92ccec88819105179dcb2550d571842601492718273fe0f2179a9695096bff94cd99dcccdea7cd9bd943bfca8fea649cac963411979a33e9)#ss7pe7ny",
        "hex": "4104124b212f5416598a92ccec88819105179dcb2550d571842601492718273fe0f2179a9695096bff94cd99dcccdea7cd9bd943bfca8fea649cac963411979a33e9ac",
        "type": "pubkey"
      }
    }
  ]
}
prepareTransactionData(testTx, '00000000000271a2dc26e7667f8419f2e15416dc6955e5a6c6cdf3f2574dd08e');

module.exports = prepareTransactionData;
