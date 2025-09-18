const express = require('express');
const cors = require('cors');
require('dotenv').config();

const connectDB = require('./config/db');

const app = express();

connectDB();

// --- Middleware ---
const corsOptions = {
  origin: 'https://carnival-system-iktp.vercel.app',
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  optionsSuccessStatus: 204
};
app.options('*', cors(corsOptions));
app.use(cors(corsOptions));

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

// The final, corrected listen command for deployment
app.listen(PORT, '0.0.0.0', () => console.log(`Server started on port ${PORT}`));