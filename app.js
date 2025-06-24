const express = require('express');
const mikrotikController = require('./Controllers/mikrotikController');

const app = express();
const port = 3000;

// Middleware untuk parsing JSON request body (jika diperlukan)
app.use(express.json());

// Routes
app.get('/interfaces', mikrotikController.getInterfaces);
app.get('/traffic/:interface', mikrotikController.getTraffic);
app.get('/latency', mikrotikController.getLatency);
app.get('/', (req, res) => {
  res.send('Welcome to the Mikrotik API');
});
app.get('/status', (req, res) => {
  res.send('API is running smoothly');
});// Start the server
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
