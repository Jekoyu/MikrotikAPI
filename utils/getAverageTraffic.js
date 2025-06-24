const { redisClient } = require('../config/redisClient');

const TRAFFIC_PREFIX = 'mikrotik:traffic:';

// Ambil semua key dan urutkan
async function getAllTrafficKeys() {
  const keys = await redisClient.keys(`${TRAFFIC_PREFIX}*`);
  return keys.sort();
}

// Parse waktu dari key redis
function extractTimestamp(key) {
  return new Date(key.slice(TRAFFIC_PREFIX.length));
}

// Hitung average untuk satu interface
async function getAverageTraffic(ifaceName) {
  try {
    const keys = await getAllTrafficKeys();
    if (keys.length < 2) throw new Error('Data tidak cukup');

    const [firstRaw, lastRaw] = await Promise.all([
      redisClient.get(keys[0]),
      redisClient.get(keys[keys.length - 1]),
    ]);

    const first = JSON.parse(firstRaw).find(i => i.name === ifaceName);
    const last = JSON.parse(lastRaw).find(i => i.name === ifaceName);

    if (!first || !last) throw new Error('Interface tidak ditemukan');

    const rxFirst = Number(first.rx);
    const txFirst = Number(first.tx);
    const rxLast = Number(last.rx);
    const txLast = Number(last.tx);

    const durationSec = Math.floor(
      (extractTimestamp(keys[keys.length - 1]) - extractTimestamp(keys[0])) / 1000
    );
    if (durationSec <= 0) throw new Error('Durasi tidak valid');

    const rxBps = Math.max(0, (rxLast - rxFirst) / durationSec);
    const txBps = Math.max(0, (txLast - txFirst) / durationSec);

    return {
      iface: ifaceName,
      average: {
        rxBps,
        txBps,
        rxKbps: rxBps / 1024,
        txKbps: txBps / 1024,
        durationSec,
      },
    };
  } catch (err) {
    return {
      iface: ifaceName,
      average: {
        rxBps: null,
        txBps: null,
        rxKbps: null,
        txKbps: null,
        durationSec: null,
      },
      error: err.message,
    };
  }
}

// Hitung average untuk semua ether1–ether5
async function getAllAverages() {
  const keys = await getAllTrafficKeys();
  if (keys.length < 2) throw new Error('Data tidak cukup');

  const [firstRaw, lastRaw] = await Promise.all([
    redisClient.get(keys[0]),
    redisClient.get(keys[keys.length - 1]),
  ]);

  const first = JSON.parse(firstRaw);
  const last = JSON.parse(lastRaw);

  const durationSec = Math.floor(
    (extractTimestamp(keys[keys.length - 1]) - extractTimestamp(keys[0])) / 1000
  );
  if (durationSec <= 0) throw new Error('Durasi tidak valid');

  return last
    .filter(i => /^ether[1-5]$/.test(i.name))
    .map(i => {
      const f = first.find(x => x.name === i.name);
      if (!f) return null;

      const rxBps = Math.max(0, (i.rx - f.rx) / durationSec);
      const txBps = Math.max(0, (i.tx - f.tx) / durationSec);

      return {
        name: i.name,
        rxBps,
        txBps,
        rxKbps: rxBps / 1024,
        txKbps: txBps / 1024,
        durationSec,
      };
    })
    .filter(Boolean);
}

module.exports = {
  getAverageTraffic,
  getAllAverages,
};
