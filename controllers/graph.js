const { redisClient } = require('../config/redisClient');

const TRAFFIC_PREFIX = 'mikrotik:traffic:';

// Ambil dan urutkan semua keys redis
async function getSortedKeys() {
  const keys = await redisClient.keys(`${TRAFFIC_PREFIX}*`);
  return keys.sort(); // Berdasarkan waktu
}

function parseTimestamp(key) {
  return key.slice(TRAFFIC_PREFIX.length);
}

// Convert bytes → Megabit (Mb)
const toMbps = (bytes) => (bytes * 8) / (1024 * 1024);

// Semua interface (ether1–5)
async function getGraphAll(req, res) {
  try {
    const keys = await getSortedKeys();
    if (keys.length < 2) throw new Error('Data tidak cukup');

    const datasets = {}; // { ether1: [{time, up, down}], ... }

    for (const key of keys) {
      const raw = await redisClient.get(key);
      const parsed = JSON.parse(raw);
      const time = parseTimestamp(key);

      parsed.forEach(iface => {
        if (!/^ether[1-5]$/.test(iface.name)) return;

        if (!datasets[iface.name]) datasets[iface.name] = [];

        datasets[iface.name].push({
          time,
          uploadMbps: toMbps(Number(iface.tx)),
          downloadMbps: toMbps(Number(iface.rx)),
        });
      });
    }

    res.json({ traffic: datasets });
  } catch (err) {
    res.status(500).json({ error: 'Gagal ambil data grafik: ' + err.message });
  }
}

// Per interface
async function getGraphPerIface(req, res) {
  const iface = req.params.iface;
  if (!/^ether[1-5]$/.test(iface)) {
    return res.status(400).json({ error: 'Interface tidak valid' });
  }

  try {
    const keys = await getSortedKeys();
    if (keys.length < 2) throw new Error('Data tidak cukup');

    const result = [];

    for (const key of keys) {
      const raw = await redisClient.get(key);
      const parsed = JSON.parse(raw);
      const time = parseTimestamp(key);

      const data = parsed.find(i => i.name === iface);
      if (!data) continue;

      result.push({
        time,
        uploadMbps: toMbps(Number(data.tx)),
        downloadMbps: toMbps(Number(data.rx)),
      });
    }

    res.json({ iface, traffic: result });
  } catch (err) {
    res.status(500).json({ error: 'Gagal ambil grafik interface: ' + err.message });
  }
}

module.exports = {
  getGraphAll,
  getGraphPerIface,
};
