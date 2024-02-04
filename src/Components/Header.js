import * as React from 'react';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import { Avatar, Container, Grid, TextField, InputAdornment } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { Link } from 'react-router-dom';
import logo from '../assets/BTCEndeavorLogoPNG.png';

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
							<Avatar src={logo} alt="BTC Endeavour Logo" />
						</IconButton>
					</Link>
					<Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
						BTC Endeavour
					</Typography>
				</Toolbar>
			</AppBar>
			<Container sx={{ marginY: 1, textAlign: 'center' }}>
				<Box sx={{ flexGrow: 1 }}>
					<Grid container spacing={2} justifyContent="center">
						<Grid item xs={12}>
							<TextField
								name="block-transaction-or-address-search"
								fullWidth
								id="outlined-basic"
								variant="outlined"
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
								}}
								autoComplete="off"
							/>
						</Grid>
						<Grid item xs={12}>
							<Grid container spacing={2}>
								<Grid item xs={3}>
									{/* Box 1 with Bitcoin icon and price */}
                                    <Box>
                                        {/* ... Bitcoin icon and price content ... */}
                                    </Box>
								</Grid>
								<Grid item xs={6}>
									{/* Box 2 with average price graph */}
                                    <Box>
                                        {/* ... Graph component or placeholder ... */}
                                    </Box>
								</Grid>
								<Grid item xs={3}>
									{/* Box 3 with circulating supply and market cap */}
                                    <Box>
                                        {/* ... Supply and market cap text ... */}
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
