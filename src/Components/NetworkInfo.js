import { Grid } from '@mui/material';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
const {
    calculateHashRate,
    calculateLargeNum,
    formatLargeNumber,
} = require('../utils/calculateNetworkInfo');

function NetworkInfo({ data }) {
    // console.log('data: ', data);
    return (
        <Box sx={{ flexGrow: 1 }}>
            <Grid container justifyContent="center">
                <Grid
                    item
                    xs={12}
                    sx={{ p: 1, my: 1, border: '1px solid gray', borderRadius: 1, backgroundColor: 'black' }}
                    justifyContent="space-between"
                >
                    <Box>
                        <Typography variant="button">Network Status</Typography>
                    </Box>
                    <Box>
                        <Grid item container alignItems="center" justifyContent="space-between">
                            <Grid item sx={{ flexGrow: 1 }} textAlign="center">
                                <Typography variant="caption">Hashrate</Typography>
                                <Typography variant="body1">{data.hashRate ? calculateHashRate(data.hashRate) : 'Loading...'}</Typography>
                            </Grid>
                            <Divider orientation="vertical" flexItem />
                            <Grid item sx={{ flexGrow: 1 }} textAlign="center">
                                <Typography variant="caption">Difficulty</Typography>
                                <Typography variant="body1">{data.difficulty ? `${data.difficulty} / ${calculateLargeNum(data.difficulty)}` : 'Loading...'}</Typography>
                            </Grid>
                            <Divider orientation="vertical" flexItem />
                            <Grid item sx={{ flexGrow: 1 }} textAlign="center">
                                <Typography variant="caption">Unconfirmed Txs</Typography>
                                <Typography variant="body1">{data.unconfirmedTxs ? formatLargeNumber(data.unconfirmedTxs) : 'Loading...'}</Typography>
                            </Grid>
                            <Divider orientation="vertical" flexItem />
                            <Grid item sx={{ flexGrow: 1 }} textAlign="center">
                                <Typography variant="caption">Current Best Fee</Typography>
                                <Typography variant="body1">{data.bestFee ? `${data?.bestFee?.feerate} BTC/kB` : 'Loading...'}</Typography>
                            </Grid>
                        </Grid>
                    </Box>
                </Grid>
            </Grid>
        </Box>
    );
}

export default NetworkInfo;
