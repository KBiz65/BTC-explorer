require('dotenv').config();
const bitcoin = require('bitcoin-core');

const bitcoinNetwork = process.env.BITCOIN_NETWORK;
const bitcoinRpcHost = process.env.BITCOIN_RPC_HOST;
const bitcoinRpcPort = process.env.BITCOIN_RPC_PORT;
const bitcoinRpcUsername = process.env.BITCOIN_RPC_USERNAME;
const bitcoinRpcPassword = process.env.BITCOIN_RPC_PASSWORD;

const bitcoinClient = new bitcoin({
  network: bitcoinNetwork,
  host: bitcoinRpcHost,
  port: bitcoinRpcPort,
  username: bitcoinRpcUsername,
  password: bitcoinRpcPassword,
});

module.exports = bitcoinClient;
