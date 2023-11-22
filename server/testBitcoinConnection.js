const { getBlockInfo, getAddressInfo } = require('./bitcoin');

async function testBitcoinConnection() {
    try {
      // Test getting block info
      const blockInfo = await getBlockInfo('0000000000000000000173cc9079d5a45c24f2fd71d1e0bad50a8c7d5ce6b1ec');
      console.log('Block Info:', blockInfo);
  
      // Test getting address info
      const addressInfo = await getAddressInfo('bc1qzke4zzgzsakeqx3c6ljeg7tha7nk4ah95g85zh');
      console.log('Address Info:', addressInfo);
    } catch (error) {
      console.error('Error:', error);
    }
  }
  
  testBitcoinConnection();
  