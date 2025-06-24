const { getInterfaces } = require('./client');

async function getTrafficInterfaces() {
  const interfaces = await getInterfaces();
  return interfaces
    .filter(i => /^ether[1-5]$/.test(i.name))
    .map(i => ({
      name: i.name,
      rx: Number(i['rx-byte'] || 0),
      tx: Number(i['tx-byte'] || 0),
      packets_rx: Number(i['rx-packet'] || 0),
      packets_tx: Number(i['tx-packet'] || 0),
    }));
}

module.exports = { getTrafficInterfaces };
