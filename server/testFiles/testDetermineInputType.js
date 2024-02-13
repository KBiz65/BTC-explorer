function determineInputScriptType(vin) {
  // Coinbase transaction check
  if (vin.coinbase) return "Coinbase";

  const isSegWit = Array.isArray(vin.txinwitness) && vin.txinwitness.length > 0;

  if (isSegWit) {
    // Basic P2WPKH check: exactly 2 items (signature and pubkey)
    if (vin.txinwitness.length === 2) return "P2WPKH";

    // Basic P2WSH check: more than 2 items could indicate a multisig, but also other script types
    // Here we simplify by calling it P2WSH which might include multisig
    if (vin.txinwitness.length > 2) return "P2WSH/Multisig";
  } else {
    // Non-SegWit transactions
    // Attempt to parse the asm for common script types or multisig patterns
    if (vin.scriptSig.asm.includes("OP_CHECKSIG")) return "P2PKH";
    if (vin.scriptSig.asm.includes("OP_HASH160")) return "P2SH";

    // Attempt to identify multisig by counting potential signatures in the scriptSig.asm
    // This is a very naive check, and might not accurately classify all multisig transactions
    const potentialSignatures = vin.scriptSig.asm.split(" ").filter(part => part.length >= 128 && part.length <= 130); // Rough filter for signatures
    if (potentialSignatures.length > 1) return "Multisig";
  }

  return "Unknown";
}

const transactionData = {
  "txid": "e538840e7dcf153110967f90429744a76b30398cb47a2099d67aac3a0ad36d25",
  "hash": "e538840e7dcf153110967f90429744a76b30398cb47a2099d67aac3a0ad36d25",
  "version": 1,
  "size": 120,
  "vsize": 120,
  "weight": 480,
  "locktime": 0,
  "vin": [
    {
      "coinbase": "03d8b8052f4249503130302f043858fb55090200000e00bafe0100072f425443432f20",
      "sequence": 0
    }
  ],
  "vout": [
    {
      "value": 25.06647762,
      "n": 0,
      "scriptPubKey": {
        "asm": "OP_DUP OP_HASH160 2c30a6aaac6d96687291475d7d52f4b469f665a6 OP_EQUALVERIFY OP_CHECKSIG",
        "desc": "addr(152f1muMCNa7goXYhYAQC61hxEgGacmncB)#20r3ggqz",
        "hex": "76a9142c30a6aaac6d96687291475d7d52f4b469f665a688ac",
        "address": "152f1muMCNa7goXYhYAQC61hxEgGacmncB",
        "type": "pubkeyhash"
      }
    }
  ],
  "hex": "01000000010000000000000000000000000000000000000000000000000000000000000000ffffffff2303d8b8052f4249503130302f043858fb55090200000e00bafe0100072f425443432f200000000001d2686895000000001976a9142c30a6aaac6d96687291475d7d52f4b469f665a688ac00000000",
  "blockhash": "000000000000000009733ff8f11fbb9575af7412df3fae97f382376709c965dc",
  "confirmations": 455172,
  "time": 1442535479,
  "blocktime": 1442535479
} // Should return "Coinbase"

// const transactionData = {
//   "txid": "120b38feabd583297e7c7fc82795f779c522e1a1d6e41363cc76f45abd113884",
//   "hash": "cdb4c0733c10c0d42e53a06eedf3c1f4d96eca5a254de7840f8af03b2ec3a3c9",
//   "version": 2,
//   "size": 204,
//   "vsize": 122,
//   "weight": 486,
//   "locktime": 0,
//   "vin": [
//     {
//       "txid": "7dba88a7d870ad8baf470ca328c336893281bd4988e255b01c2ff507e748a1a4",
//       "vout": 69,
//       "scriptSig": {
//         "asm": "",
//         "hex": ""
//       },
//       "txinwitness": [
//         "3045022100c78e58a1aecdea21f83c2288a6bcf989e9ee715ada977f900878c3ee8225dd300220674824690ef2c67b7d094aaedc921fe14bdd1898bf36952689986626f376522001",
//         "02d4720f0065d50568522315f4dddedd10e4c41f05d4241bfcb55db8f42618a413"
//       ],
//       "sequence": 4294967293
//     }
//   ],
//   "vout": [
//     {
//       "value": 0.02072064,
//       "n": 0,
//       "scriptPubKey": {
//         "asm": "1 77724198f18ae8582222c581efc346a9bc75e073cccd4bc24ad119c96a7ba817",
//         "desc": "rawtr(77724198f18ae8582222c581efc346a9bc75e073cccd4bc24ad119c96a7ba817)#nq6l3uq5",
//         "hex": "512077724198f18ae8582222c581efc346a9bc75e073cccd4bc24ad119c96a7ba817",
//         "address": "bc1pwaeyrx833t59sg3zckq7ls6x4x78tcrnenx5hsj26yvuj6nm4qts9lvwxl",
//         "type": "witness_v1_taproot"
//       }
//     }
//   ],
//   "hex": "02000000000101a4a148e707f52f1cb055e28849bd81328936c328a30c47af8bad70d8a788ba7d4500000000fdffffff01009e1f000000000022512077724198f18ae8582222c581efc346a9bc75e073cccd4bc24ad119c96a7ba81702483045022100c78e58a1aecdea21f83c2288a6bcf989e9ee715ada977f900878c3ee8225dd300220674824690ef2c67b7d094aaedc921fe14bdd1898bf36952689986626f3765220012102d4720f0065d50568522315f4dddedd10e4c41f05d4241bfcb55db8f42618a41300000000",
//   "blockhash": "00000000000000000001bfe1a00ed3f660b89016088487d6f180d01805d173a3",
//   "confirmations": 5144,
//   "time": 1704821251,
//   "blocktime": 1704821251
// };

console.log(determineInputScriptType(transactionData.vin[0]));
