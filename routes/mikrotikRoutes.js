const express = require('express');
const router = express.Router();
const { connectToMikrotik, getIdentity, pingAddress, isConnected } = require('../mikrotik/client');

router.get('/ping/:ip', async (req, res) => {
  const ip = req.params.ip;

  if (!isConnected()) {
    return res.status(400).json({ error: 'Belum terhubung ke Mikrotik. Akses /connect dulu.' });
  }

  try {
    const result = await pingAddress(ip);
    res.json({ result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


router.get('/api/connect', async (req, res) => {
    const success = await connectToMikrotik();
    res.json({ connected: success });
  });
  
  router.get('/api/identity', async (req, res) => {
    try {
      const identity = await getIdentity();
      res.json({ identity });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.get('/devices', async (req, res) => {
    if (!isConnected()) {
      return res.status(400).json({ error: 'Belum terhubung ke Mikrotik. Akses /connect dulu.' });
    }
  
    try {
      const devices = await getDevices();
      res.json({ devices });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  
module.exports = router;
