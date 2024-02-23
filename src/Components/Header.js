import { useEffect, useState } from 'react';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import { Avatar, Container, Grid, TextField, InputAdornment } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { Link } from 'react-router-dom';
import axios from 'axios';
import EndeavourLogo from '../assets/BTCEndeavorLogoPNG.png';


function Header({ searchTerm, setSearchTerm, handleSearch }) {

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
                        <Grid item xs={12} sx={{ p: 1, mt: 1, border: '1px solid gray', borderRadius: 1, backgroundColor: 'black' }}>
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
                    </Grid>
                </Box>
            </Container>
        </Box>
    );
}

export default Header;
