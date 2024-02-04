require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const routes = require('./routes');

const app = express();
const port = process.env.PORT || 3001;

// Parse incoming JSON data
app.use(bodyParser.json());
// app.use(cors()); // Basic CORS configuration (allow all origins)
// Or for more control:
app.use(cors({
  origin: 'http://localhost:3000',// Allow only specific origin
  methods: 'GET,POST', // Allow only specific methods
}));

// Use routes for specific endpoints
app.use('/', routes);

// Handle errors
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
