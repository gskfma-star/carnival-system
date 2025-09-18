const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Import custom modules
const connectDB = require('./config/db');

// Initialize the Express application
const app = express();

// --- Connect to Database ---
connectDB();

// --- Middleware ---

// 1. Final, Secure CORS Configuration
// This explicitly handles the browser's pre-flight "OPTIONS" request
// and allows requests only from your specific Vercel URL.
const corsOptions = {
  origin: 'https://carnival-system-iktp.vercel.app',
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  optionsSuccessStatus: 204
};
app.options('*', cors(corsOptions)); // Enable pre-flight for all routes
app.use(cors(corsOptions)); // Use CORS for all other requests

// 2. Express JSON Parser: Allows the server to accept JSON in the request body.
app.use(express.json());

// --- Define API Routes ---
// Connects your route files to the main application
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