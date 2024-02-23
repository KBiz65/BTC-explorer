import { useEffect, useState } from 'react';
import { Grid, Avatar } from '@mui/material';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import axios from 'axios';
import LatestBlocksTable from './Tables/LatestBlocksTable';
import LatestTransactionsTable from './Tables/LatestTransactionsTable';
import NetworkInfo from './NetworkInfo';
import BitcoinLogo from '../assets/bitcoin-btc-logo.png';
import BitcoinGraph from '../assets/BTC-Graph.png';
const { formatAmount } = require('../utils/formatData');
const { calculateLargeNum } = require('../utils/calculateNetworkInfo');

function HomePage() {
    const [latestBlocks, setLatestBlocks] = useState([]);
    const [latestTransactions, setLatestTransactions] = useState([]);
    const [historicalPrices, setHistoricalPrices] = useState([]);
    const [currentPrice, setCurrentPrice] = useState(0);
    const [currentSupply, setCurrentSupply] = useState(0);
    const [priceChange, setPriceChange] = useState({
        priceDifference: '',
        upOrDown: '',
    });
    const [networkStats, setNetworkStats] = useState({
        hashrate: null,
        difficulty: null,
        unconfirmedTxs: null,
        currentBestFee: null,
    });

    useEffect(() => {
        const yesterdayRate = historicalPrices[1]?.price; // change this to [0] from 02/17/2024 and forward.
        const ratio = parseFloat(yesterdayRate) / parseFloat(currentPrice);
        const percentDiff = ratio * 100 - 100;
        setPriceChange({
            priceDifference: `${percentDiff > 0 ? '+' : '-'} ${Math.abs(percentDiff).toFixed(2)}%`,
            upOrDown: `${percentDiff > 0 ? 'up' : 'down'}`,
        });
    }, [historicalPrices]);

    useEffect(() => {
        const source = axios.CancelToken.source();

        async function fetchHomepageData() {
            try {
                const [pricingResponse, circulatingSupplyResponse, blocksResponse, transactionsResponse, networkStatsResponse] = await Promise.all([
                    axios.get('http://localhost:3001/network/prices', { cancelToken: source.token }),
                    axios.get('http://localhost:3001/network/circulating', { cancelToken: source.token }),
                    axios.get('http://localhost:3001/blocks/latest', { cancelToken: source.token }),
                    axios.get('http://localhost:3001/transactions/latest', { cancelToken: source.token }),
                    axios.get('http://localhost:3001/network/currentStats', { cancelToken: source.token }),
                ]);

                setCurrentPrice(pricingResponse.data.currentBTCPrice);
                setHistoricalPrices(pricingResponse.data.historicalBTCPrices);
                setCurrentSupply(circulatingSupplyResponse.data.circulatingSupply);
                setLatestBlocks(blocksResponse.data.latestBlocks);
                setLatestTransactions(transactionsResponse.data.latestTransactions);
                setNetworkStats(networkStatsResponse.data.networkInfo);
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
            <Grid
                container
                sx={{ p: 1, mt: 2, border: '1px solid gray', borderRadius: 1, bgcolor: 'black' }}
                alignItems="center"
                justifyContent="space-between"
            >
                {/* Avatar & Information Container */}
                <Grid item xs={12} md={4} lg={3} container spacing={2} alignItems="center" sx={{ pl: 1 }}>
                    {/* Avatar Column */}
                    <Grid item>
                        <Avatar src={BitcoinLogo} sx={{ width: 56, height: 56 }} />
                    </Grid>

                    {/* Information Column */}
                    <Grid item xs>
                        <Box>
                            <Typography variant="h6" component="div" sx={{ display: 'flex', alignItems: 'center' }}>
                                Bitcoin
                                <Chip
                                    label="BTC"
                                    size="small"
                                    sx={{ bgcolor: 'white', color: 'orange', borderRadius: 1, ml: 1 }}
                                />
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Typography variant="body2">
                                    {currentPrice ? `$${formatAmount(currentPrice)}` : 'Loading...'}
                                </Typography>
                                <Typography
                                    variant="body2"
                                    sx={{ color: priceChange.upOrDown === 'up' ? 'green' : 'red', ml: 1 }}
                                >
                                    {currentPrice ? priceChange.priceDifference : 'Loading...'}
                                </Typography>
                            </Box>
                        </Box>
                    </Grid>
                </Grid>

                {/* Graph - Only show on md and up, takes minimal required space */}
                <Grid item md={4} lg={4} display={{ xs: 'none', md: 'block' }}>
                    <img
                        src={BitcoinGraph}
                        alt="Bitcoin 6 month price graph"
                        style={{ maxWidth: '100%', height: 'auto' }}
                    />
                </Grid>

                {/* Circulating Supply & Market Cap */}
                {/* Circulating Supply & Market Cap - Adjusts based on available space */}
                <Grid item xs={12} md={4} lg={5} sx={{ pr: 1 }}>
                    <Box display="flex" justifyContent="space-between">
                        <Box>
                            <Typography variant="caption" display="block">
                                Circulation
                            </Typography>
                            <Typography variant="body1">{currentSupply ? `${formatAmount(currentSupply)} BTC` : 'Loading...'}</Typography>
                        </Box>
                        <Box>
                            <Typography variant="caption" display="block">
                                Not Mined
                            </Typography>
                            <Typography variant="body1">{currentSupply ? `${formatAmount(21000000 - currentSupply)} BTC` : 'Loading...'}</Typography>
                        </Box>
                        <Box>
                            <Typography variant="caption" display="block">
                                Market Cap
                            </Typography>
                            <Typography variant="body1">{currentSupply ? `$${calculateLargeNum(
                                currentSupply * historicalPrices[0]?.price)}` : 'Loading...'}</Typography>
                        </Box>
                    </Box>
                </Grid>
            </Grid>

            {/* Below sections */}
            <Grid container spacing={2} sx={{ mt: 2 }}>
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
