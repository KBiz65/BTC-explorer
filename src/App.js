import React, { useState } from 'react';
import { ThemeProvider, CssBaseline } from '@mui/material';
import theme from './theme';
import Header from './Components/Header';
import HomePage from './Components/HomePage';
import BlockPage from './Components/BlockPage';
import TransactionPage from './Components/TransactionPage';
import AddressPage from './Components/AddressPage';
import axios from 'axios';
import { Routes, Route } from 'react-router-dom';
import './App.css';
import { Container } from '@mui/material';

function App() {
	// State to store the Bitcoin address entered by the user
	const [searchTerm, setSearchTerm] = useState('');

	const handleSearch = async () => {
		console.log(`You are searching for ${searchTerm}`);

		try {
			const response = await axios.get(`http://localhost:3001/search/${searchTerm}`);
			const data = response.data;
			console.log('data: ', data);
			// Need to write the code to handle the data and decide what to do with it.
			// Expects a response of an array of objects. There should only be one
			// array item if there is only one block, transaction, or address that matches
			// the search term. The code will then show the information if there is only one item
			// in the array and let the user know there is more than one option they could
			// be searching for with that term and give them the option to pick which one
			// they meant:
			// Example: [
			//   {
			//     type: 'block',
			//     info: {
			//       this will all of the block info needed to display to user
			//     }
			//   }
			// ]
		} catch (error) {
			console.log('Search error: ', error);
			// Need to write the logic for the error. Need to display the error to the user.
		}
	};

	return (
		<ThemeProvider theme={theme}>
			<CssBaseline />
			<div className="app">
				<Header searchTerm={searchTerm} setSearchTerm={setSearchTerm} handleSearch={handleSearch} />
				<Container>
					<Routes>
						<Route path="/" element={<HomePage />} />
						<Route path="/block/:blockId" element={<BlockPage />} />
						<Route path="/transaction/:transactionHash" element={<TransactionPage />} />
						<Route path="/address/:address" element={<AddressPage />} />
					</Routes>
				</Container>
			</div>
		</ThemeProvider>
	);
}

export default App;
