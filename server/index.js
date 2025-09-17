// Import required packages
const express = require('express');
const cors = require('cors');
require('dotenv').config(); // Loads environment variables from .env

// Import custom modules
const connectDB = require('./config/db');

// Initialize the Express application
const app = express();

// --- Connect to Database ---
connectDB();

// --- Middleware ---
app.use(cors());
app.use(express.json());

// --- Define API Routes ---
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/transactions', require('./routes/transactions'));
app.use('/api/admin', require('./routes/admin'));

// --- Basic Route for Testing ---
app.get('/', (req, res) => {
  res.send('Carnival QR Code System API is running...');
});

// --- Start the Server ---
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));

