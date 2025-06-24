const schedule = require('node-schedule');
const { redisClient } = require('../config/redisClient');
const { getTrafficInterfaces } = require('../mikrotik/queries');

redisClient.on('error', err => console.error('❌ Redis error:', err));

async function startTrafficLogger() {
  const CRON_PATTERN = '*/5 * * * *'; // ⏲️ Tiap 5 menit
  console.log(`📆 Jadwal scheduler: '${CRON_PATTERN}' (Asia/Jakarta)`);

  schedule.scheduleJob(
    CRON_PATTERN,
    { tz: 'Asia/Jakarta' },
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
