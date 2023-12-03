const hexToBitcoinAddress = require('./hexToBitcoinAddress');

function findRecipientAddress(vout) {
    for (const output of vout) {
      if (output.scriptPubKey && output.scriptPubKey.address) {
        // If there's an address in vout's scriptPubKey, use it as the recipient
        return output.scriptPubKey.address;
      } else if (output.scriptPubKey && output.scriptPubKey.hex) {
        // If there's no address but there's hex in scriptPubKey, convert it to an address
        return hexToBitcoinAddress(output.scriptPubKey.hex);
      }
    }
    return null;
}
  
module.exports = findRecipientAddress;
