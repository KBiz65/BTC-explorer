import React, { useState } from 'react';

function App() {
  // State to store the Bitcoin address entered by the user
  const [address, setAddress] = useState('');
  
  // State to store the balance retrieved from the database
  const [balance, setBalance] = useState(null);

  // Function to handle the address input and initiate the balance query
  const handleSearch = () => {
    // logic to query the database for the balance here
    // Make an API request to the backend to fetch data and update the UI
    // For now, we'll just display the entered address
    console.log(`Searching for address: ${address}`);
  };

  return (
    <div className="App">
      <h1>Bitcoin Explorer</h1>
      <p>Enter a Bitcoin address to check its balance:</p>
      <input
        type="text"
        placeholder="Enter Bitcoin Address"
        value={address}
        onChange={(e) => setAddress(e.target.value)}
      />
      <button onClick={handleSearch}>Search</button>
      
      {balance !== null && (
        <div>
          <p>Balance for address: {address}</p>
          <p>{balance} BTC</p>
        </div>
      )}
    </div>
  );
}

export default App;
