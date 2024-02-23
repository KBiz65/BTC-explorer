const prepareTransactionData = require('../utils/prepareTransactionData');
const batchInsertTransactions = require('../dbOperations/batchInsertTransactions');

const getTransactionInfo = async (transaction) => {
  const prepareTxResponse = await prepareTransactionData(transaction);
  console.log('Transaction Data: ', prepareTxResponse);
}

const transactionOne = {
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
    ],
    "hex": "01000000010000000000000000000000000000000000000000000000000000000000000000ffffffff060456720e1b00ffffffff0100f2052a01000000434104124b212f5416598a92ccec88819105179dcb2550d571842601492718273fe0f2179a9695096bff94cd99dcccdea7cd9bd943bfca8fea649cac963411979a33e9ac00000000",
    "block_hash": "00000000000743f190a18c5577a3c2d2a1f610ae9601ac046a38084ccb7cd721",
    "confirmations": 739747,
    "time": 1289781379,
    "blocktime": 1289781379
}

const preparedTransactionData = [
  {
    txid: 'e3bf3d07d4b0375638d5f1db5255fe07ba2c4cb067cd81b84ee974b6585fb468',
    txhash: 'e3bf3d07d4b0375638d5f1db5255fe07ba2c4cb067cd81b84ee974b6585fb468',
    block_hash: '00000000000743f190a18c5577a3c2d2a1f610ae9601ac046a38084ccb7cd721',
    size: 133,
    virtual_size: 133,
    weight: 532,
    lock_time: 0,
    version: 1,
    fees: 0,
    inputs: [
      {
        txid: 'e3bf3d07d4b0375638d5f1db5255fe07ba2c4cb067cd81b84ee974b6585fb468',
        referenced_txid: 'coinbase',
        referenced_output_index: -1,
        input_sequence: 4294967295,
        witnesses: []
      }
    ],
    outputs: [
      {
        txid: 'e3bf3d07d4b0375638d5f1db5255fe07ba2c4cb067cd81b84ee974b6585fb468',
        amount: 50,
        output_index: 0,
        address: '1GktTvnY8KGfAS72DhzGYJRyaQNvYrK9Fg'
      }
    ]
  }
];
  
// getTransactionInfo(transactionOne);
batchInsertTransactions(preparedTransactionData);