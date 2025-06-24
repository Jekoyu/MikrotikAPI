const RouterOS = require('routeros-client');
const redis = require('redis');
const dotenv = require('dotenv');

dotenv.config();

// Setup Redis Client
const redisClient = redis.createClient({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
  password: process.env.REDIS_PASSWORD,
  tls: {
    servername: process.env.REDIS_HOST, // Redis Cloud biasanya membutuhkan koneksi TLS
  },
});

redisClient.on('connect', () => {
  console.log('Connected to Redis');
});

redisClient.on('error', (err) => {
  console.error('Redis Client Error', err);
});

// Setup Mikrotik Config
const mikrotikConfig = {
  
  host: process.env.MIKROTIK_HOST,
  user: process.env.MIKROTIK_USER,
  pass: process.env.MIKROTIK_PASS,
  port: 8729,
  secure: true, 
  timeout: 100,
};

// Debugging: Log the RouterOS object to see how it should be used
console.log('RouterOS:', RouterOS);
// console.log('RouterOS version:', RouterOS.version);

// Use the correct class or constructor from the RouterOS object
let connection;

try {
  connection = new RouterOS.RouterOSClient(mikrotikConfig);  // Use RouterOSClient from the RouterOS export
  console.log(mikrotikConfig);
  console.log("Mikrotik connection object created");
} catch (err) {
  console.error("Error establishing Mikrotik connection object:", err);
}

// Function to connect to Mikrotik
const connectToMikrotik = async () => {
  try {
    console.log("Attempting to connect to Mikrotik...");
    if (connection) {
      await connection.connect();
      console.log("Connected to Mikrotik successfully");
      
      // Check if the connection works by sending a test query
      const result = await connection.query('/interface/print'); // Example query to verify connection
      console.log('Test query result:', result);
    } else {
      console.error("No connection available to Mikrotik");
    }
  } catch (err) {
    console.error("Mikrotik connection error: ", err);
  }
};

connectToMikrotik();

// Fetch and cache data from Mikrotik
const fetchAndCache = async (methodName, cacheKey) => {
  cacheKey = 'mikrotik:' + cacheKey;

  return new Promise((resolve, reject) => {
    redisClient.get(cacheKey, async (err, cachedData) => {
      if (err) {
        reject('Error fetching from Redis: ' + err);
      }

      if (cachedData) {
        return resolve(JSON.parse(cachedData)); // Return cached data
      }

      try {
        if (connection) {
          // Query Mikrotik for data
          const data = await connection.query(`/${methodName}/print`);
          redisClient.setex(cacheKey, 300, JSON.stringify(data)); // Cache for 5 minutes
          resolve(data);
        } else {
          reject('No connection to Mikrotik available');
        }
      } catch (err) {
        reject('Error fetching data from Mikrotik: ' + err);
      }
    });
  });
};

module.exports = {
  fetchAndCache,
  connection,
};
