const { CronJob } = require('cron');
const { redisClient } = require('../config/redisClient');
const { getTrafficInterfaces } = require('../mikrotik/queries');

redisClient.on('error', err => console.error('❌ Redis error:', err));

let job; // Untuk menghindari duplikasi scheduler

async function startTrafficLogger() {
  if (job) {
    console.warn('⚠️ Scheduler sudah berjalan, skip duplikasi.');
    return;
  }

  const CRON_PATTERN = '0 */5 * * * *'; // Tiap 5 menit (detik ke-0)
  console.log(`📆 Jadwal scheduler: '${CRON_PATTERN}' (Asia/Jakarta)`);

  job = new CronJob(
    CRON_PATTERN,
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
    },
    null,
    true,
    'Asia/Jakarta'
  );

  job.start(); // Memulai job secara eksplisit
}

module.exports = startTrafficLogger;
