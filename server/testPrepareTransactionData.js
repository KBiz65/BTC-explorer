const calculateTransactionFee = require('../server/utils/calculateTransactionFee');
const { determineInputType, determineOutputAddress } = require('../server/utils/parseTransactionUtils');

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
        console.log('transactionData: ', transactionData);
        return transactionData;
    } catch (error) {
        console.error('Error in prepareTransactionData:', error);
        throw error; // or handle the error as needed
    }
};

prepareTransactionData({
    "txid": "d5d27987d2a3dfc724e359870c6644b40e497bdc0589a033220fe15429d88599",
    "hash": "d5d27987d2a3dfc724e359870c6644b40e497bdc0589a033220fe15429d88599",
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
                "asm": "046896ecfc449cb8560594eb7f413f199deb9b4e5d947a142e7dc7d2de0b811b8e204833ea2a2fd9d4c7b153a8ca7661d0a0b7fc981df1f42f55d64b26b3da1e9c OP_CHECKSIG",
                "desc": "pk(046896ecfc449cb8560594eb7f413f199deb9b4e5d947a142e7dc7d2de0b811b8e204833ea2a2fd9d4c7b153a8ca7661d0a0b7fc981df1f42f55d64b26b3da1e9c)#4pqpyumn",
                "hex": "41046896ecfc449cb8560594eb7f413f199deb9b4e5d947a142e7dc7d2de0b811b8e204833ea2a2fd9d4c7b153a8ca7661d0a0b7fc981df1f42f55d64b26b3da1e9cac",
                "type": "pubkey"
            }
        }
    ]
}, '00000000000af0aed4792b1acee3d966af36cf5def14935db8de83d6f9306f2f');

module.exports = prepareTransactionData;
