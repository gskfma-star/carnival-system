const express = require('express');
const cors = require('cors');

const app = express();

// Use the simplest possible CORS configuration to allow everything
app.use(cors());

// A single, simple route
app.get('/', (req, res) => {
  res.send('Hello CORS World!');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Test server running on port ${PORT}`));