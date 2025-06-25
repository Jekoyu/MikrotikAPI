const { CronJob } = require('cron');
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');
const { redisClient } = require('../config/redisClient');
const { getTrafficInterfaces } = require('../mikrotik/queries');

dayjs.extend(utc);
dayjs.extend(timezone);

redisClient.on('error', err => console.error('❌ Redis error:', err));

let job;

async function startTrafficLogger() {
  if (job) {
    console.warn('⚠️ Scheduler sudah berjalan, skip duplikasi.');
    return;
  }

  const CRON_PATTERN = '0 */2 * * * *'; // Tiap 5 menit
  console.log(`📆 Jadwal scheduler: '${CRON_PATTERN}' (Asia/Jakarta)`);

  job = new CronJob(
    CRON_PATTERN,
    async () => {
      const timestamp = dayjs().tz('Asia/Jakarta').format();
      console.log(`⏱️ [${timestamp}] Menjalankan scheduler (Asia/Jakarta)...`);

      try {
        const traffic = await getTrafficInterfaces();
        const key = `mikrotik:traffic:${timestamp}`;
        await redisClient.set(key, JSON.stringify(traffic), {
          EX: 60 * 60 * 24 * 7,
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

  job.start();
}

module.exports = startTrafficLogger;
