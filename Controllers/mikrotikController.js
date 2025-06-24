const mikrotikService = require('../services/mikrotikService');

// Fungsi timeout helper
const withTimeout = (promise, ms) => {
  const timeout = new Promise((_, reject) =>
    setTimeout(() => reject(new Error(`Request timeout after ${ms} ms`)), ms)
  );
  return Promise.race([promise, timeout]);
};

// Ambil koneksi aktif, pastikan connect dulu, dan limit 5 detik
const getMikrotikConnection = async () => {
  const connection = mikrotikService.connection;
  if (!connection) throw new Error('Mikrotik connection not initialized');
  if (!connection.connected) {
    await withTimeout(connection.connect(), 5000);
  }
  return connection;
};

const getInterfaces = async (req, res) => {
  try {
    const data = await withTimeout(
      mikrotikService.fetchAndCache('interface', 'interfaces'),
      5000
    );
    res.json({ status: 'success', data });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

const getTraffic = async (req, res) => {
  const { interface: iface } = req.params;

  if (!iface) {
    return res.status(400).json({ status: 'error', message: 'Interface name is required' });
  }

  try {
    const connection = await getMikrotikConnection();

    const data = await withTimeout(
      connection.query('/interface/monitor-traffic', [
        `=interface=${iface}`,
        '=once=',
      ]),
      5000
    );

    res.json({ status: 'success', data });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

const getLatency = async (req, res) => {
  try {
    const connection = await getMikrotikConnection();

    const data = await withTimeout(
      connection.query('/ping', [
        `=address=${process.env.MIKROTIK_HOST}`,
        '=count=3',
      ]),
      5000
    );

    let totalLatency = 0;
    let validCount = 0;

    data.forEach(item => {
      if (item.time) {
        totalLatency += parseFloat(item.time);
        validCount++;
      }
    });

    if (validCount === 0) {
      return res.status(500).json({ status: 'error', message: 'No valid latency data' });
    }

    const avgLatency = totalLatency / validCount;

    res.json({
      status: 'success',
      latency: avgLatency.toFixed(2),
      raw: data,
    });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

module.exports = {
  getInterfaces,
  getTraffic,
  getLatency,
};
