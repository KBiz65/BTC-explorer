import * as React from 'react';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Link from '@mui/material/Link';
import { Link as RouterLink } from 'react-router-dom';
const calculateTimePassed = require('../../utils/calculateTimePassed');
const { truncateData } = require('../../utils/formatData');

const LatestBlocksTable = ({ data }) => {
    const tableRows = (
        <>
            {data.length > 0 ? (
                data.map((transaction) => (
                    <TableRow key={transaction.txid}>
                        <TableCell>{truncateData(transaction.txid, 'txid')}</TableCell>
                        <TableCell>{calculateTimePassed(transaction.txData.time)} ago</TableCell>
                        <TableCell>{transaction.valueSum}</TableCell>
                    </TableRow>
                ))
            ) : (
                <TableRow>
                    <TableCell colSpan={3}>Loading transactions...</TableCell>
                </TableRow>
            )}
        </>
    );
    return (
        <div className="latest-blocks-table">
            <TableContainer component={Paper} sx={{ border: '1px solid gray', borderRadius: 1 }}>
                <Table size="small" sx={{ backgroundColor: 'black' }}>
                    <TableBody>
                        <TableRow>
                            <TableCell
                                colSpan={3}
                                sx={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                }}
                            >
                                <Typography variant="button">Latest Transactions</Typography>
                                <Link component={RouterLink} to="/transactions" underline="none" color="#7DB9E8">
                                    <Typography variant="body2">
                                        View All
                                    </Typography>
                                </Link>
                            </TableCell>
                        </TableRow>
                    </TableBody>
                </Table>

                <Table size="small" sx={{ backgroundColor: 'black' }}>
                    <TableHead>
                        <TableRow sx={{ backgroundColor: '#262626' }}>
                            <TableCell>
                                <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
                                    Transaction Hash
                                </Typography>
                            </TableCell>
                            <TableCell>
                                <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
                                    Time
                                </Typography>
                            </TableCell>
                            <TableCell>
                                <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
                                    Amount
                                </Typography>
                            </TableCell>
                        </TableRow>
                    </TableHead>

                    <TableBody>{tableRows}</TableBody>
                </Table>
            </TableContainer>
        </div>
    );
};

export default LatestBlocksTable;
