const bitcoinClient = require('../bitcoinClient');

const calculateTransactionFee = async (transaction) => {
    let totalInputs = 0;
    let totalOutputs = transaction.vout.reduce((acc, output) => acc + output.value, 0);
  
    for (const input of transaction.vin) {
      if (input.coinbase) {
        return 0;
      }
  
      const inputTx = await bitcoinClient.getRawTransaction(input.txid, true);
      const inputTxOutput = inputTx.vout[input.vout];
      totalInputs += inputTxOutput.value;
    }
  
    return totalInputs - totalOutputs;
};
  
module.exports = calculateTransactionFee;