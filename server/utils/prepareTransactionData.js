const calculateTransactionFee = require('../testFiles/calculateTransactionFee');
const { determineInputType, determineOutputAddress } = require('./parseTransactionUtils');

const prepareTransactionData = async (transaction, blockhash, txTime) => {
    try {
        const transactionData = {
            transactionHash: transaction.txid,
            blockHash: blockhash,
            size: transaction.size,
            vsize: transaction.vsize,
            weight: transaction.weight,
            lockTime: transaction.locktime,
            version: transaction.version,
            time: txTime,
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

module.exports = prepareTransactionData;
