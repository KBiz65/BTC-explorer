// BEFORE RUNNING THIS YOU MUST MOVE IT TO THE SERVER FOLDER
// TO HAVE ACCESS TO THE ENVS FROM THE POOL AND BITCOIN CLIENT

const pool = require('../database');
const bitcoinClient = require('../bitcoinClient');

const batchSize = 1000; // Number of transactions to process in each batch

async function updateTransactionTimes() {
	let continueProcessing = true; // Flag to control the loop

	while (continueProcessing) {
		const client = await pool.connect();

		try {
			const { rows: txids } = await client.query(
				'SELECT txid FROM transactions WHERE time = 0 LIMIT $1',
				[batchSize]
			);

			if (txids.length === 0) {
				continueProcessing = false;
				console.log('No more transactions to update.');
				break;
			}

			// Fetch transaction details and prepare update data
			const updates = await Promise.all(
				txids.map(async ({ txid }) => {
					try {
						const rawTransaction = await bitcoinClient.command('getrawtransaction', txid, true);
						return { txid, time: rawTransaction && rawTransaction.time ? rawTransaction.time : 0 }; // Use 0 if time is missing or error occurs
					} catch (error) {
						console.error(`Error fetching transaction ${txid} from Bitcoin client:`, error);
						return { txid, time: 0 }; // Return time as 0 for transactions that could not be fetched/processed
					}
				})
			);

			// Batch update the transactions in the database
			const updateQuery =
				'UPDATE transactions SET time = CASE txid ' +
				updates
					.map(({ txid, time }, index) => `WHEN $${index * 2 + 1}::text THEN $${index * 2 + 2}::bigint`)
					.join(' ') +
				' END WHERE txid IN (' +
				updates.map(({ txid }, index) => `$${index * 2 + 1}::text`).join(', ') +
				')';

			const queryParams = updates.flatMap(({ txid, time }) => [txid, time]);

			await client.query(updateQuery, queryParams);
			console.log(`Updated time for ${updates.length} transactions.`);
		} catch (error) {
			console.error('Error during batch processing:', error);
		} finally {
			client.release();
		}
	}

	console.log('Finished updating transaction times.');
}

updateTransactionTimes();
