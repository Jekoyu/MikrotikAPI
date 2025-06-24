const mikrotikService = require('../services/mikrotikService');

const getInterfaces = async (req, res) => {
  try {
    const data = await mikrotikService.fetchAndCache('interface', 'interfaces');
    res.json({ status: 'success', data });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

const getTraffic = async (req, res) => {
  const { interface: iface } = req.params;
  try {
    const data = await mikrotikService.client.query(
      RouterOS.query('/interface/monitor-traffic').equal('interface', iface).equal('once', '')
    );
    res.json({ status: 'success', data });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

const getLatency = async (req, res) => {
  try {
    const latency = await mikrotikService.client.query(RouterOS.query('/ping').equal('address', process.env.MIKROTIK_HOST).equal('count', 3));
    let totalLatency = 0;
    let validCount = 0;

    latency.forEach(item => {
      if (item.time) {
        totalLatency += parseFloat(item.time);
        validCount++;
      }
    });

    if (validCount === 0) {
      return res.status(500).json({ status: 'error', message: 'No valid latency data' });
    }

    const avgLatency = totalLatency / validCount;
    res.json({ status: 'success', latency: avgLatency.toFixed(2) });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

module.exports = {
  getInterfaces,
  getTraffic,
  getLatency,
};
