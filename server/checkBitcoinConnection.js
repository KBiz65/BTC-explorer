const client = require('./bitcoinClient');

client.getBlockchainInfo().then((info) => console.log(info)).catch((err) => console.error(err));
