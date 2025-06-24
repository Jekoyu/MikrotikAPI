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
const toMbps = (bytes) => bytes / (1024 * 1024)/100; // sebenarnya MB, tapi biarkan nama tetap


// Semua interface (ether1–5)
async function getGraphAll(req, res) {
  try {
    const keys = await getSortedKeys();
    if (keys.length < 2) throw new Error('Data tidak cukup');

    const now = new Date();
    const nowJakarta = toJakartaTime(now);
    console.log('Current time in Jakarta:', nowJakarta.toISOString());
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const hourlyData = {};

    // Buat kategori 24 jam terakhir berdasarkan waktu Jakarta
    for (let i = 0; i < 24; i++) {
      const date = new Date(nowJakarta.getTime() - (23 - i) * 60 * 60 * 1000);
      const hourKey = `${String(date.getHours()).padStart(2, '0')}:00`;
      hourlyData[hourKey] = { uploadTotal: 0, downloadTotal: 0, count: 0 };
    }

    for (const key of keys) {
      if (!key.includes('mikrotik:traffic:')) continue;

      const raw = await redisClient.get(key);
      if (!raw) continue;

      const parsed = JSON.parse(raw);
      const timestampStr = key.split(':').slice(2).join(':');
      const time = new Date(timestampStr);
      if (isNaN(time.getTime()) || time < twentyFourHoursAgo) continue;

      const localTime = toJakartaTime(time); // Adjust to UTC+7
      const hour = `${String(localTime.getHours()).padStart(2, '0')}:00`;

      parsed.forEach(iface => {
        if (!/^ether[1-5]$/.test(iface.name)) return;

        const upload = toMbps(Number(iface.tx));
        const download = toMbps(Number(iface.rx));

        if (!hourlyData[hour]) {
          hourlyData[hour] = { uploadTotal: 0, downloadTotal: 0, count: 0 };
        }

        hourlyData[hour].uploadTotal += upload;
        hourlyData[hour].downloadTotal += download;
        hourlyData[hour].count += 1;
      });
    }

    const categories = [];
    const upload = [];
    const download = [];

    for (let i = 0; i < 24; i++) {
      const date = new Date(nowJakarta.getTime() - (23 - i) * 60 * 60 * 1000);
      const hourKey = `${String(date.getHours()).padStart(2, '0')}:00`;
      const data = hourlyData[hourKey];

      categories.push(hourKey);
      if (data.count > 0) {
        upload.push(Number((data.uploadTotal / data.count).toFixed(2)));
        download.push(Number((data.downloadTotal / data.count).toFixed(2)));
      } else {
        upload.push(0);
        download.push(0);
      }
    }

    res.json({ categories, upload, download });

  } catch (err) {
    res.status(500).json({ error: 'Gagal ambil data grafik: ' + err.message });
  }
}

function toJakartaTime(date) {
  return new Date(date.getTime() + 7 * 60 * 60 * 1000); // UTC+7
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
