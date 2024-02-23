require('dotenv').config();
const express = require('express');
const router = express.Router();
const axios = require('axios');
const pool = require('../database');
const bitcoinClient = require('../bitcoinClient'); // Import bitcoinClient connection

async function fetchPriceForDate(date) {
	try {
		const response = await axios.get(`https://api.coinbase.com/v2/prices/BTC-USD/spot?date=${date}`);
		return response?.data?.data?.amount || null;
	} catch (error) {
		console.error(`Error fetching price for date ${date}:`, error.message);
		return null;
	}
}

async function updateHistoricalPrices() {
	try {
		let {
			rows: [latestEntry],
		} = await pool.query('SELECT date FROM bitcoin_prices ORDER BY date DESC LIMIT 1');
		let startDate = latestEntry ? new Date(latestEntry.date) : new Date('2013-08-01');
		const endDate = new Date() - 1;
		startDate.setDate(startDate.getDate() + 1);

		while (startDate <= endDate) {
			const dateString = startDate.toISOString().split('T')[0];
			const price = await fetchPriceForDate(dateString);

			if (price) {
				await pool.query(
					'INSERT INTO bitcoin_prices (date, price) VALUES ($1, $2) ON CONFLICT (date) DO NOTHING',
					[dateString, price]
				);
				console.log(`Updated price for ${dateString}: $${price}`);
			}

			startDate.setDate(startDate.getDate() + 1);
		}
	} catch (error) {
		console.error('Error retrieving pricing info:', error);
	}
}

// GET current blockchain stats
router.get('/currentStats', async (req, res) => {
	try {
		// Query the bitcoin blockchain for the latest unconfirmed transactions
		const hashRate = await bitcoinClient.getNetworkHashPs();
		const difficulty = await bitcoinClient.getDifficulty();
		const mempoolInfo = await bitcoinClient.getMempoolInfo();
		const bestFee = await bitcoinClient.estimateSmartFee(2);

		res.json({
			networkInfo: {
				hashRate,
				difficulty,
				unconfirmedTxs: mempoolInfo.size,
				bestFee,
			},
		});
	} catch (error) {
		console.error('Error retrieving network info:', error);
		res.status(500).json({ error: 'Internal server error' });
	}
});

// GET Bitcoin historical pricing for 6 months
router.get('/prices', async (req, res) => {
	try {
		await updateHistoricalPrices();

		const sixMonthsAgo = new Date();
		sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
		const sixMonthsAgoString = sixMonthsAgo.toISOString().split('T')[0];

		const { rows: prices } = await pool.query(
			'SELECT date, price FROM bitcoin_prices WHERE date >= $1 ORDER BY date DESC',
			[sixMonthsAgoString]
		);

		const todayBTCPriceResponse = await axios.get('https://api.coinbase.com/v2/prices/BTC-USD/spot');

		res.status(200).json({ historicalBTCPrices: prices, currentBTCPrice: todayBTCPriceResponse?.data?.data?.amount || null });
	} catch (error) {
		console.error('Error retrieving historical pricing info:', error);
		res.status(500).json({ error: 'Internal server error' });
	}
});

// GET Total bitcoin currently in circulatoin
router.get('/circulating', async (req, res) => {
	try {
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

		res.status(200).json({ circulatingSupply: Number(totalCoins) });
	} catch (error) {
		console.error('Error calculating circulating supply:', error);
		res.status(500).json({ error: 'Internal server error' });
	}
});

module.exports = router;
