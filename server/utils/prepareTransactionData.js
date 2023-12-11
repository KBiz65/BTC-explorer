const calculateTransactionFee = require('./calculateTransactionFee');
const parseTransaction = require('./parseTransaction');

const prepareTransactionData = async (transaction) => {
    const transactionFee = await calculateTransactionFee(transaction);
    const parsedTransaction = parseTransaction(transaction);
    const transactionData = {
        transactionHash: transaction.txid,
        blockHash: transaction.blockhash,
        version: parsedTransaction.version,
        size: transaction.size,
        vsize: transaction.vsize,
        weight: transaction.weight,
        lockTime: parsedTransaction.lockTime,
        timestamp: transaction.blocktime,
        confirmations: transaction.confirmations,
        fee: transactionFee,
        inputs: parsedTransaction.inputs,
        outputs: parsedTransaction.outputs,
        witnesses: parsedTransaction.witnesses,
        isMultisig: false,
    };

    // console.log('transactionData: ', transactionData)
    return transactionData;
};

module.exports = prepareTransactionData;
