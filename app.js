const express = require('express');
const dotenv = require('dotenv');
const mikrotikService = require('./services/mikrotikService'); // Pastikan ini benar
const mikrotikRoutes = require('./routes/mikrotikRoutes'); // Sesuaikan dengan rute Anda

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware (jika ada)
app.use(express.json());

// Route
app.use('/api/mikrotik', mikrotikRoutes);

// Health check endpoint
app.get('/health', (_, res) => {
  res.json({ status: 'ok' });
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server is running at http://localhost:${PORT}`);
});
