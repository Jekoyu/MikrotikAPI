const { RouterOSAPI } = require('node-routeros');
require('dotenv').config();

let conn;
let retry = 0;
let hbTimer;

const connect = async () => {
  const { MIKROTIK_HOST, MIKROTIK_USER, MIKROTIK_PASS } = process.env;

  console.log('🚀 Mencoba connect...');

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
    console.log('✅ Connected!');

    const identity = await conn.write('/system/identity/print');
    console.log('📛 Identity:', identity);

    retry = 0;
    startHeartbeat();
    bindEvents();
  } catch (err) {
    console.error('❌ Gagal connect:', err.message || err);
    scheduleReconnect();
  }
};

const startHeartbeat = () => {
  clearInterval(hbTimer);
  hbTimer = setInterval(async () => {
    try {
      const hb = await conn.write('/system/identity/print');
      console.log('💓 Heartbeat:', hb[0]?.name);
    } catch (err) {
      console.warn('⚠️ Heartbeat gagal:', err.message || err);
    }
  }, 30_000);
};

const bindEvents = () => {
    try {
      if (conn.connection && typeof conn.connection.on === 'function') {
        conn.connection.on('close', () => {
          console.warn('🔌 Koneksi tertutup');
          cleanup();
          scheduleReconnect();
        });
        conn.connection.on('error', (e) => {
          console.warn('❌ Error koneksi:', e.message || e);
          cleanup();
          scheduleReconnect();
        });
      } else {
        console.warn('⚠️ Tidak bisa bind event, connection object tidak tersedia.');
      }
    } catch (e) {
      console.warn('⚠️ Gagal bind event:', e.message || e);
    }
  };
  

const cleanup = () => {
  clearInterval(hbTimer);
  try {
    conn.close();
  } catch (_) {}
};

const scheduleReconnect = () => {
  const delay = Math.min(5000 * 2 ** retry, 60000);
  console.log(`🔁 Coba reconnect dalam ${delay / 1000}s...`);
  setTimeout(connect, delay);
  retry++;
};

connect();
