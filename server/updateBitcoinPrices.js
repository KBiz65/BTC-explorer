const axios = require('axios');
const pool = require('./database');

async function updateHistoricalPrices() {
    const client = await pool.connect();

    try {
        const {
            rows: [latestEntry],
        } = await client.query('SELECT date FROM bitcoin_prices ORDER BY date DESC LIMIT 1');
        let startDate = latestEntry ? new Date(latestEntry.date) : new Date('2013-08-02'); // Assuming you want to start from Bitcoin's early days if empty
        const endDate = new Date();
        startDate.setDate(startDate.getDate() + 1); // Start from the day after the latest entry

        while (startDate <= endDate) {
            const dateString = startDate.toISOString().split('T')[0];
            const price = await fetchPriceForDate(dateString); // Implement this function to fetch price

            await client.query(
                'INSERT INTO bitcoin_prices (date, price) VALUES ($1, $2) ON CONFLICT (date) DO NOTHING',
                [dateString, price]
            );
            console.log(`Updated price for ${dateString}: $${price}`);

            startDate.setDate(startDate.getDate() + 1);
        }
    } finally {
        client.release();
    }
}

async function fetchPriceForDate(date) {
    try {
        const response = await axios.get(`https://api.coinbase.com/v2/prices/BTC-USD/spot?date=${date}`);
        const amount = response?.data?.data?.amount;

        if (amount) {
            return amount;
        } else {
            console.log('Price data is missing in the response');
            return null;
        }
    } catch (error) {
        console.error(`Error fetching price for date ${date}:`, error.message);
        return null; // Return null if there was an error fetching the price
    }
}

// Call this function to update prices
updateHistoricalPrices().then(() => console.log('Historical prices updated'));
