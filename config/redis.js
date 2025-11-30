const redis = require('redis');

// Redis Configuration
const redisConfig = {
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  db: process.env.REDIS_DB || 0,
  retry_delay_on_failover: 100,
  maxRetriesPerRequest: 3,
  lazyConnect: true,
  retry_strategy: (options) => {
    if (process.env.NODE_ENV === 'development') {
      return undefined; // Stop retrying immediately in dev
    }
    if (options.error && options.error.code === 'ECONNREFUSED') {
      console.error('❌ Redis server refused connection');
      return new Error('Redis server refused connection');
    }
    if (options.total_retry_time > 1000 * 60 * 60) {
      console.error('❌ Redis retry time exhausted');
      return new Error('Retry time exhausted');
    }
    if (options.attempt > 10) {
      console.error('❌ Redis retry attempts exhausted');
      return undefined;
    }
    return Math.min(options.attempt * 100, 3000);
  }
};

let redisClient;
let isRedisConnected = false;

try {
  redisClient = redis.createClient(redisConfig);

  redisClient.on('connect', () => {
    console.log('✅ Redis Connected Successfully');
    isRedisConnected = true;
  });

  redisClient.on('ready', () => {
    console.log('✅ Redis Client Ready');
    isRedisConnected = true;
  });

  redisClient.on('error', (err) => {
    if (isRedisConnected || process.env.NODE_ENV !== 'development') {
      console.error('❌ Redis Error:', err.message);
    }
    isRedisConnected = false;
  });

  redisClient.on('end', () => {
    console.log('⚠️  Redis Connection Ended');
    isRedisConnected = false;
  });
} catch (error) {
  console.warn('⚠️  Failed to initialize Redis client:', error.message);
  // Create a mock client to prevent crashes
  redisClient = {
    connect: async () => { },
    quit: async () => { },
    set: async () => { },
    get: async () => { },
    del: async () => { },
    setEx: async () => { },
    exists: async () => { },
    ttl: async () => { },
    on: () => { }
  };
}

// Connect to Redis
const connectRedis = async () => {
  try {
    if (process.env.NODE_ENV === 'development') {
      // Try to connect with a short timeout or just catch the error immediately
      await Promise.race([
        redisClient.connect(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Redis connection timeout')), 1000))
      ]);
    } else {
      await redisClient.connect();
    }
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('⚠️  Redis connection failed - Running without cache (Development Mode)');
      isRedisConnected = false;
      return;
    }
    console.error('❌ Failed to connect to Redis:', error);
    throw error;
  }
};

// Graceful shutdown
const closeRedis = async () => {
  if (!isRedisConnected || !redisClient.isOpen) return;
  try {
    await redisClient.quit();
    console.log('✅ Redis connection closed');
  } catch (error) {
    console.error('❌ Error closing Redis connection:', error);
  }
};

// Cache helper functions
const cacheHelpers = {
  set: async (key, value, expireInSeconds = null) => {
    if (!isRedisConnected) return true;
    try {
      const serializedValue = JSON.stringify(value);
      if (expireInSeconds) {
        await redisClient.setEx(key, expireInSeconds, serializedValue);
      } else {
        await redisClient.set(key, serializedValue);
      }
      return true;
    } catch (error) {
      console.error('❌ Redis SET error:', error);
      return false;
    }
  },

  get: async (key) => {
    if (!isRedisConnected) return null;
    try {
      const value = await redisClient.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('❌ Redis GET error:', error);
      return null;
    }
  },

  del: async (key) => {
    if (!isRedisConnected) return true;
    try {
      await redisClient.del(key);
      return true;
    } catch (error) {
      console.error('❌ Redis DEL error:', error);
      return false;
    }
  },

  setex: async (key, seconds, value) => {
    return await cacheHelpers.set(key, value, seconds);
  },

  exists: async (key) => {
    if (!isRedisConnected) return false;
    try {
      const exists = await redisClient.exists(key);
      return exists === 1;
    } catch (error) {
      console.error('❌ Redis EXISTS error:', error);
      return false;
    }
  },

  ttl: async (key) => {
    if (!isRedisConnected) return -2;
    try {
      return await redisClient.ttl(key);
    } catch (error) {
      console.error('❌ Redis TTL error:', error);
      return -2;
    }
  }
};

module.exports = {
  redisClient,
  connectRedis,
  closeRedis,
  cacheHelpers,
  ...cacheHelpers
};
