const { RouterOSAPI } = require('node-routeros');
require('dotenv').config();

let conn;
let hbTimer;

const connectToMikrotik = async () => {
  const { MIKROTIK_HOST, MIKROTIK_USER, MIKROTIK_PASS } = process.env;

  console.log('🚀 Mencoba connect ke Mikrotik...');

  conn = new RouterOSAPI({
    host: MIKROTIK_HOST,
    user: MIKROTIK_USER,
    password: MIKROTIK_PASS,
    port: 8728,
    secure: false,
    timeout: 5000,
  });

  try {
    await conn.connect();
    const identity = await conn.write('/system/identity/print');
    console.log('✅ Connected! 📛 Identity:', identity);
    startHeartbeat();
    return true;
  } catch (err) {
    console.error('❌ Gagal connect:', err.message || err);
    return false;
  }
};

const startHeartbeat = () => {
  clearInterval(hbTimer);
  hbTimer = setInterval(async () => {
    try {
      const res = await conn.write('/system/identity/print');
      console.log('💓 Heartbeat OK:', res[0]?.name);
    } catch (err) {
      console.warn('💔 Heartbeat gagal:', err.message || err);
    }
  }, 30000);
};

const getIdentity = async () => {
  try {
    const res = await conn.write('/system/identity/print');
    return res;
  } catch (err) {
    throw new Error('❌ Gagal ambil identity: ' + err.message);
  }
};
const isConnected = () => !!conn;

const pingAddress = async (ip) => {
  if (!conn) throw new Error('Belum terhubung ke Mikrotik');
  return await conn.write('/ping', [
    `=address=${ip}`,
    '=count=1',
  ]);
};
const getDevices = async () => {
  if (!conn) throw new Error('Belum terhubung ke Mikrotik');
  return await conn.write('/ip/dhcp-server/lease/print');
};
const getInterfaces = async () => {
  if (!conn) throw new Error('Belum terhubung ke Mikrotik');

  const allInterfaces = await conn.write('/interface/print');
  
 
  const filtered = allInterfaces.filter(i =>
    /^ether[1-5]$/.test(i.name)
  );

  return filtered;
};

const getInterfaceTraffic = async (iface) => {
  if (!conn) throw new Error('Belum terhubung ke Mikrotik');
  if (!iface) throw new Error('Interface tidak boleh kosong');

  const result = await conn.write('/interface/monitor-traffic', [
    `=interface=${iface}`,
    '=once='
  ]);

  return result;
};

const getSystem = async () => {
  if (!conn) throw new Error('Belum terhubung ke Mikrotik');
  return await conn.write('/system/resource/print');
};
const getLogs = async () => {
  if (!conn) throw new Error('Belum terhubung ke Mikrotik');
  
  const logs = await conn.write('/log/print');
  
  // Filter log: kecualikan log "admin logged out" dari IP tertentu
  const filteredLogs = logs.filter(log => {
    // Cek apakah log mengandung kata "admin logged out" dan IP tertentu
    return !(log.message.includes('user admin logged out') || log.message.includes('user admin logged in') || log.message.includes('10.20.20.1'));
  });

  return filteredLogs;
};





module.exports = {
  connectToMikrotik,
  getIdentity,
  pingAddress,
  isConnected,
  getDevices,
  getInterfaces,
  getInterfaceTraffic,
  getSystem,
  getLogs
};
