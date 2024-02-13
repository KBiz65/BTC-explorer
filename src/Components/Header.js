import { useEffect, useState } from 'react';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Chip from '@mui/material/Chip';
import { Avatar, Container, Grid, TextField, InputAdornment } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { Link } from 'react-router-dom';
import axios from 'axios';
import EndeavourLogo from '../assets/BTCEndeavorLogoPNG.png';
import BitcoinLogo from '../assets/bitcoin-btc-logo.png';
import BitcoinGraph from '../assets/BTC-Graph.png';
const { formatAmount } = require('../utils/formatData');
const { calculateLargeNum } = require('../utils/calculateNetworkInfo');

function Header({ searchTerm, setSearchTerm, handleSearch }) {
    const [historicalPrices, setHistoricalPrices] = useState([]);
    const [priceChange, setPriceChange] = useState({
        priceDifference: '',
        upOrDown: '',
    });
    const [currentSupply, setCurrentSupply] = useState(0);

    useEffect(() => {
        const source = axios.CancelToken.source();

        async function fetchHeaderData() {
            try {
                const pricingResponse = await axios.get('http://localhost:3001/network/prices', {
                    cancelToken: source.token,
                });

                const circulatingSupplyResponse = await axios.get('http://localhost:3001/network/circulating', {
                    cancelToken: source.token,
                });
        
                setHistoricalPrices(pricingResponse.data.bitcoinPrices);
                setCurrentSupply(circulatingSupplyResponse.data.circulatingSupply);
            } catch (error) {
                if (!axios.isCancel(error)) {
                    console.error('Search error:', error);
                }
            };
        };

        fetchHeaderData();

        // Cleanup function
        return () => {
            source.cancel('Operation canceled by the user.');
        };
    }, []);

    useEffect(() => {
        const todayRate = historicalPrices[0]?.price;
        const yesterdayRate = historicalPrices[1]?.price;
        const ratio = parseFloat(yesterdayRate) / parseFloat(todayRate);
        const percentDiff = (ratio * 100) - 100;
        setPriceChange({
            priceDifference: `${percentDiff > 0 ? "+" : "-"} ${Math.abs(percentDiff).toFixed(2)}%`,
            upOrDown: `${percentDiff > 0 ? "up" : "down"}`
        });
    }, [historicalPrices])

    const handleKeyDown = (event) => {
        if (event.key === 'Enter') {
            handleSearch();
            event.preventDefault();
        }
    };

    return (
        <Box sx={{ flexGrow: 1 }}>
            <AppBar position="static" style={{ background: 'transparent' }}>
                <Toolbar>
                    <Link to="/">
                        <IconButton edge="start" color="inherit" sx={{ mr: 2 }}>
                            <Avatar src={EndeavourLogo} alt="BTC Endeavour Logo" />
                        </IconButton>
                    </Link>
                    <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                        BTC Endeavour
                    </Typography>
                </Toolbar>
            </AppBar>
            <Container sx={{ marginY: 1, textAlign: 'center' }}>
                <Box sx={{ flexGrow: 1 }}>
                    <Grid container justifyContent="center">
                        <Grid item xs={12} sx={{ p: 1, my: 1, border: '1px solid gray', borderRadius: 1, backgroundColor: 'black' }}>
                            <TextField
                                name="block-transaction-or-address-search"
                                fullWidth
                                variant="standard"
                                placeholder="Enter a block height, block hash, transaction hash or address to search"
                                value={searchTerm} // Controlled component
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onKeyDown={handleKeyDown} // Handle enter key press
                                InputProps={{
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton onClick={handleSearch}>
                                                <SearchIcon fontSize="large" />
                                            </IconButton>
                                        </InputAdornment>
                                    ),
                                    disableUnderline: true,
                                }}
                                autoComplete="off"
                            />
                        </Grid>
                        <Grid item xs={12} sx={{ p: 1, my: 1, border: '1px solid gray', borderRadius: 1, backgroundColor: 'black' }} justifyContent="space-between">
                            <Grid container spacing={2} alignItems="center">
                                <Grid item xs={2} container direction="row" spacing={2} alignItems="center" justifyContent="space-between" >
                                    {/* Avatar column */}
                                    <Grid item xs={3}>
                                        <Avatar src={BitcoinLogo} />
                                    </Grid>

                                    {/* Right column */}
                                    <Grid item xs={9}>
                                        <Grid container alignItems="center">
                                            <Typography variant="h6" sx={{ paddingRight: 1 }}>Bitcoin</Typography>
                                            <Chip
                                                label="BTC"
                                                size="small"
                                                sx={{ bgcolor: 'white', color: 'orange', borderRadius: 1 }}
                                            />
                                        </Grid>
                                        <Grid container alignItems="center">
                                            <Typography variant="body2">{ historicalPrices ? `$${formatAmount(historicalPrices[0]?.price)}` : 'Loading...' }</Typography>
                                            <Typography variant="body2" sx={{ color: priceChange.upOrDown === 'up' ? 'green' : 'red', pl: 1 }}>
                                                {priceChange.priceDifference ? priceChange.priceDifference : 'Loading...'}
                                            </Typography>
                                        </Grid>
                                    </Grid>
                                </Grid>
                                <Grid item xs={5}>
                                    {/* Box 2 with average price graph */}
                                    <Box>
                                        <img src={BitcoinGraph} alt="Bitcoin 6 month price graph" />
                                    </Box>
                                </Grid>
                                <Grid item xs={5} alignItems="center" justifyContent="space-between">
                                    {/* Box 3 with circulating supply and market cap */}
                                    <Box>
                                        <Grid item container alignItems="center" justifyContent="space-between" >
                                            {/* Avatar column */}
                                            <Grid item xs={4} textAlign="left">
                                                <Typography variant="caption">Circulation</Typography>
                                                <Typography variant="body1">{`${formatAmount(currentSupply)} BTC`}</Typography>
                                            </Grid>
                                            {/* Avatar column */}
                                            <Grid item xs={4} textAlign="left">
                                                <Typography variant="caption">Not Mined</Typography>
                                                <Typography variant="body1">{`${formatAmount(21000000 - currentSupply)} BTC`}</Typography>
                                            </Grid>
                                            {/* Avatar column */}
                                            <Grid item xs={3} textAlign="left">
                                                <Typography variant="caption">Market Cap</Typography>
                                                <Typography variant="body1">{`$${calculateLargeNum(currentSupply * historicalPrices[0]?.price)}`}</Typography>
                                            </Grid>
                                        </Grid>
                                    </Box>
                                </Grid>
                            </Grid>
                        </Grid>
                    </Grid>
                </Box>
            </Container>
        </Box>
    );
}

export default Header;
