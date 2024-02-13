const bitcoinClient = require('./bitcoinClient'); // Import bitcoinClient connection

async function getBitcoinsInCirculation() {
  const currentBlockchainHeight = await bitcoinClient.getBlockCount();
  let totalCoins = 0;
  let reward = 50;
  let blocksPerHalving = 210000;
  
  for (let block = 0; block <= currentBlockchainHeight; block += blocksPerHalving) {
    let blocksAtThisReward;
    // Check if it's the last iteration
    if (block + blocksPerHalving > currentBlockchainHeight) {
      // Adjust for the blocks in the current halving period
      blocksAtThisReward = currentBlockchainHeight - block + 1;
    } else {
      blocksAtThisReward = blocksPerHalving;
    }
    totalCoins += blocksAtThisReward * reward;
    reward /= 2; // Halve the reward for the next period
  }

  return totalCoins;
}


getBitcoinsInCirculation();
