const express = require('express');
const router = express.Router();
const { connectToMikrotik, getIdentity, pingAddress, isConnected ,getInterfaces,getInterfaceTraffic,getDevices,getSystem} = require('../mikrotik/client');
const { getAverageTraffic, getAllAverages } = require('../utils/getAverageTraffic');
const {getGraphAll,getGraphPerIface,
} = require('../controllers/graph');
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
router.get('/traffic/graph', getGraphAll);
router.get('/traffic/graph/:iface', getGraphPerIface);
router.get('/interfaces', async (req, res) => {
    if (!isConnected()) return res.status(400).json({ error: 'Belum konek Mikrotik' });
  
    try {
      const result = await getInterfaces();
      res.json({ interfaces: result });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  
  
router.get('/traffic/:iface', async (req, res) => {
    const iface = req.params.iface;
    if (!isConnected()) return res.status(400).json({ error: 'Belum konek Mikrotik' });
  
    try {
      const result = await getInterfaceTraffic(iface);
      res.json({ iface, traffic: result });
    } catch (err) {
      res.status(500).json({ error: `Gagal ambil traffic untuk ${iface}: ${err.message}` });
    }
  });
  

router.get('/connect', async (req, res) => {
    const success = await connectToMikrotik();
    res.json({ connected: success });
  });
  
  router.get('/identity', async (req, res) => {
    try {
      const identity = await getIdentity();
      res.json({ identity });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  
  
  router.get('/system', async (req, res) => {
    try {
      const system = await getSystem();
      res.json({ system });
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
  router.get('/traffic/all', async (req, res) => {

  
    try {
      const data = await getAllAverages();
      res.json({  interfaces: data });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  
  router.get('/traffic/average/:iface', async (req, res) => {
    const { iface } = req.params;
    
  
    try {
      const data = await getAverageTraffic(iface);
      res.json({ iface,  average: data });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  
module.exports = router;
