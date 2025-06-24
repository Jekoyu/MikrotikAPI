const RouterOS = require('routeros-client');
const redis = require('redis');
const dotenv = require('dotenv');

dotenv.config();

const redisClient = redis.createClient({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
  password: process.env.REDIS_PASSWORD,
  tls: {
    servername: process.env.REDIS_HOST,
  },
});

redisClient.on('connect', () => {
  console.log('✅ Connected to Redis');
});

redisClient.on('error', (err) => {
  console.error('❌ Redis Error:', err);
});

const mikrotikConfig = {
  host: process.env.MIKROTIK_HOST,
  user: process.env.MIKROTIK_USER,
  pass: process.env.MIKROTIK_PASS,
  port: 8729,
  secure: true,
  timeout: 1000,
};

let connection;

try {
  connection = new RouterOS.RouterOSClient(mikrotikConfig);
  console.log('🔌 Mikrotik connection object created');
} catch (err) {
  console.error('❌ Failed to initialize Mikrotik connection:', err);
}

const fetchAndCache = async (methodName, cacheKey) => {
  const fullKey = 'mikrotik:' + cacheKey;

  return new Promise((resolve, reject) => {
    redisClient.get(fullKey, async (err, cachedData) => {
      if (err) return reject(new Error('Redis error: ' + err));
      if (cachedData) return resolve(JSON.parse(cachedData));

      try {
        if (!connection.connected) await connection.connect();

        const data = await connection.query(`/${methodName}/print`);
        redisClient.setex(fullKey, 300, JSON.stringify(data));
        resolve(data);
      } catch (err) {
        reject(new Error('Mikrotik query failed: ' + err));
      }
    });
  });
};

module.exports = {
  connection,
  fetchAndCache,
};
