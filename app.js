const express = require('express');
const dotenv = require('dotenv');
const mikrotikRoutes = require('./routes/mikrotikRoutes');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());

// Routing
app.use('/api/mikrotik', mikrotikRoutes);

// Health check
app.get('/', (req, res) => {
  res.json({ status: 'Mikrotik API server is running' });
});

// Start the server
app.listen(PORT, () => {
  console.log(`✅ Server is running at hehe http://localhost:${PORT}`);
});
