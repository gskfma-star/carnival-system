const express = require('express');
const cors = require('cors');
require('dotenv').config();

const connectDB = require('./config/db');

const app = express();

connectDB();

// --- Middleware ---

// This is the new, more robust CORS configuration.
// It explicitly handles the browser's preflight "OPTIONS" request.
const corsOptions = {
  origin: 'https://carnival-system-ikpt.vercel.app', // Corrected from your log, iktp -> ikpt
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  optionsSuccessStatus: 204
};
app.options('*', cors(corsOptions)); // Enable pre-flight for all routes
app.use(cors(corsOptions)); // Use CORS for all other requests

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