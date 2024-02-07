import { useEffect, useState } from 'react';
import { Grid } from '@mui/material';
import axios from 'axios';
import LatestBlocksTable from './Tables/LatestBlocksTable';
import LatestTransactionsTable from './Tables/LatestTransactionsTable';
import NetworkInfo from './NetworkInfo';

function HomePage() {
    const [latestBlocks, setLatestBlocks] = useState([]);
    const [latestTransactions, setLatestTransactions] = useState([]);
    const [networkStats, setNetworkStats] = useState({
        hashrate: null,
        difficulty: null,
        unconfirmedTxs: null,
        currentBestFee: null,
    });

    useEffect(() => {
        const source = axios.CancelToken.source();

        async function fetchHomepageData() {
            try {
                const blocksResponse = await axios.get('http://localhost:3001/blocks/latest', {
                    cancelToken: source.token,
                });

                const transactionsResponse = await axios.get('http://localhost:3001/transactions/latest', {
                    cancelToken: source.token,
                });

                const networkStats = await axios.get('http://localhost:3001/network/currentStats', {
                    cancelToken: source.token,
                });

                setLatestBlocks(blocksResponse.data.latestBlocks);
                setLatestTransactions(transactionsResponse.data.latestTransactions);
                setNetworkStats(networkStats.data.networkInfo);

            } catch (error) {
                if (!axios.isCancel(error)) {
                    console.error('Search error:', error);
                }
            }
        }

        fetchHomepageData();

        // Cleanup function
        return () => {
            source.cancel('Operation canceled by the user.');
        };
    }, []);

    return (
        <div>
            <Grid container spacing={2}>
                <Grid item xs={6}>
                    <LatestBlocksTable data={latestBlocks} />
                </Grid>
                <Grid item xs={6}>
                    <LatestTransactionsTable data={latestTransactions} />
                </Grid>
                <Grid item xs={12}>
                    <NetworkInfo data={networkStats} />
                </Grid>
            </Grid>
        </div>
    );
}

export default HomePage;
