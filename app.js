const express = require('express');
const dotenv = require('dotenv');
const mikrotikRoutes = require('./routes/mikrotikRoutes');
const { connectToMikrotik } = require('./mikrotik/client');

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(mikrotikRoutes);

app.get('/', (req, res) => {
  res.json({ status: 'Mikrotik API server is running' });
});

app.listen(PORT, async () => {
  console.log(`✅ Server is running at http://localhost:${PORT}`);

  // Langsung connect saat server mulai
  const connected = await connectToMikrotik();
  if (!connected) {
    console.warn('⚠️ Gagal konek ke Mikrotik saat startup. Coba akses /connect secara manual.');
  }
});
