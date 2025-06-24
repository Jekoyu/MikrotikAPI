const schedule = require('node-schedule');
const { redisClient } = require('../config/redisClient');
const { getTrafficInterfaces } = require('../mikrotik/queries');

redisClient.on('error', err => console.error('❌ Redis error:', err));

async function startTrafficLogger() {
  schedule.scheduleJob(
    '*/5 * * * *', // per menit, ubah ke '*/5 * * * *' untuk tiap 5 menit nanti
    { tz: 'Asia/Jakarta' }, // 🕒 zona waktu Jakarta
    async () => {
      const timestamp = new Date().toISOString();
      console.log(`⏱️ [${timestamp}] Menjalankan scheduler (Asia/Jakarta)...`);

      try {
        const traffic = await getTrafficInterfaces();
        const key = `mikrotik:traffic:${timestamp}`;
        await redisClient.set(key, JSON.stringify(traffic), {
          EX: 60 * 60 * 24 * 7, // TTL 7 hari
        });
        console.log(`📦 Simpan traffic ke Redis: ${key}`);
      } catch (err) {
        console.error('🚫 Gagal simpan traffic:', err.message);
      }
    }
  );
}

module.exports = startTrafficLogger;
